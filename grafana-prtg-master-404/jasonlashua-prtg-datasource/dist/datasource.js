"use strict";

System.register(["lodash", "app/core/utils/datemath", "./PRTGAPIService", "./utils"], function (_export, _context) {
  "use strict";

  var _, dateMath, utils, _createClass, PRTGDataSource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreUtilsDatemath) {
      dateMath = _appCoreUtilsDatemath;
    }, function (_PRTGAPIService) {}, function (_utils) {
      utils = _utils;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export("PRTGDataSource", PRTGDataSource = function () {
        /** @ngInject */
        function PRTGDataSource(instanceSettings, templateSrv, alertSrv, PRTGAPIService) {
          _classCallCheck(this, PRTGDataSource);

          /**
           * PRTG Datasource
           *
           * @param {object} Grafana Datasource Object
           */
          this.templateSrv = templateSrv;
          this.alertSrv = alertSrv;
          this.name = instanceSettings.name;
          this.url = instanceSettings.url;
          //this.tzShift = 0;
          this.tzAutoAdjust = instanceSettings.jsonData.tzAutoAdjust;
          this.username = instanceSettings.jsonData.prtgApiUser;
          this.passhash = instanceSettings.jsonData.prtgApiPasshash; //WTF doesn't secureJsonData work? Poorly documented. 
          this.cacheTimeoutMintues = instanceSettings.jsonData.cacheTimeoutMinutes || 5;
          this.limitmetrics = instanceSettings.meta.limitmetrics || 100;
          this.prtgAPI = new PRTGAPIService(this.url, this.username, this.passhash, this.cacheTimeoutMintues, this.tzAutoAdjust);
        }

        /**
         * Test the datasource
         */


        _createClass(PRTGDataSource, [{
          key: "testDatasource",
          value: function testDatasource() {
            return this.prtgAPI.getVersion().then(function (apiVersion) {
              return {

                status: "success",
                title: "Success",
                message: "PRTG API version: " + apiVersion
              };
            }, function (error) {
              return {
                status: "error",
                title: error.status + ": " + error.statusText,
                message: "" //error.config.url
              };
            });
          }
        }, {
          key: "query",
          value: function query(options) {
            var _this = this;

            var from = Math.ceil(dateMath.parse(options.range.from) / 1000);
            var to = Math.ceil(dateMath.parse(options.range.to) / 1000);

            var promises = _.map(options.targets, function (t) {
              var target = _.cloneDeep(t);
              if (target.hide || !target.group || !target.device || !target.channel || !target.sensor) {
                return [];
              }
              //play nice with legacy dashboards, add options property
              if (!target.options) {
                target.options = {};
              }
              target.group.name = _this.templateSrv.replace(target.group.name, options.scopedVars);
              target.device.name = _this.templateSrv.replace(target.device.name, options.scopedVars);
              target.sensor.name = _this.templateSrv.replace(target.sensor.name, options.scopedVars);
              target.channel.name = _this.templateSrv.replace(target.channel.name, options.scopedVars);
              if (target.group.name == "*") {
                target.group.name = "/.*/";
              }
              if (target.device.name == "*") {
                target.device.name = "/.*/";
              }
              if (target.sensor.name == "*") {
                target.sensor.name = "/.*/";
              }
              if (target.channel.name == "*") {
                target.channel.name = "/.*/";
              }
              if (!target.options.mode) {
                //legacy dashboard compat.
                target.options.mode = { name: "Metrics" };
              }

              if (target.options.mode.name == "Metrics") {
                return _this.queryMetrics(target, from, to);
              } else if (target.options.mode.name == "Text") {
                return _this.queryText(target);
              } else if (target.options.mode.name == "Raw") {
                return _this.queryRaw(target);
              }
            });
            return Promise.all(_.flatten(promises)).then(function (results) {
              return { data: _.flatten(results) };
            });
          }
        }, {
          key: "queryRaw",
          value: function queryRaw(target) {
            return this.prtgAPI.performPRTGAPIRequest(target.raw.uri, target.raw.queryString).then(function (rawData) {
              if (Array.isArray(rawData)) {
                return _.map(rawData, function (doc) {
                  return { target: "blah", datapoints: [doc], type: "docs" };
                });
              } else {
                return { target: "blah", datapoints: [rawData], type: "docs" };
              }
            });
          }
        }, {
          key: "queryText",
          value: function queryText(target) {
            /**
             * Get items isn't required
             * case value from: sensor group or device
             * -> perform query, then filter.
             * existing getDevices getSensors getGroups can be used since they include all properties
             */
            var textPromise = void 0;
            if (target.options.textValueFrom.name == "group") {
              textPromise = this.prtgAPI.getGroups(target.group.name);
            } else if (target.options.textValueFrom.name == "device") {
              textPromise = this.prtgAPI.getHosts(target.group.name, target.device.name);
            } else if (target.options.textValueFrom.name == "sensor") {
              textPromise = this.prtgAPI.getSensors(target.group.name, target.device.name, target.sensor.name);
            } else {
              return Promise.resolve([]);
            }

            if (!target.options.textFilter) {
              target.options.textFilter = "/.*/";
            }

            return textPromise.then(function (items) {
              var filtered = _.filter(items, function (item) {
                return utils.filterMatch(item[target.options.textProperty.name], target.options.textFilter);
              });
              return _.map(filtered, function (item) {
                var alias = item[target.options.textValueFrom.name];
                //const decodeText = document.createElement("textarea"); //dont seem to need this any more.
                //decodeText.innerHTML = item[target.options.textProperty.name];
                return { target: alias, datapoints: [[item[target.options.textProperty.name], Date.now()]] };
              });
            });
          }
        }, {
          key: "queryMetrics",
          value: function queryMetrics(target, from, to) {
            var _this2 = this;

            return this.prtgAPI.getItemsFromTarget(target).then(function (items) {
              var devices = _.uniq(_.map(items, "device"));
              var historyPromise = _.map(items, function (item) {
                return _this2.prtgAPI.getItemHistory(item.sensor, item.name, from, to).then(function (history) {
                  var alias = item.name;
                  if (target.options.includeSensorName) {
                    alias = item.sensor_raw + ": " + alias;
                  }
                  if (_.keys(devices).length > 1 || target.options.includeDeviceName) {
                    alias = item.device + ": " + alias;
                  }
                  var datapoints = _.map(history, function (hist) {
                    var value = hist.value;
                    if (target.options.multiplier && utils.isNumeric(target.options.multiplier)) {
                      value = hist.value * target.options.multiplier;
                    }
                    return [value, hist.datetime];
                  });
                  var timeseries = { target: alias, datapoints: datapoints };
                  return timeseries;
                });
              });
              return Promise.all(historyPromise);
            });
          }
        }, {
          key: "annotationQuery",
          value: function annotationQuery(options) {
            var _this3 = this;

            var from = Math.ceil(dateMath.parse(options.range.from) / 1000);
            var to = Math.ceil(dateMath.parse(options.range.to) / 1000);
            return this.prtgAPI.getMessages(from, to, options.annotation.sensorId).then(function (messages) {
              _.each(messages, function (message) {
                message.annotation = options.annotation; //inject the annotation into the object
              }, _this3);
              return messages;
            });
          }
        },
        // Andreas
         {
          key: "metricFindQuery",
          value: async function metricFindQuery(query) {
            var _this4 = this;
            var Id;
            var vars = this.templateSrv.variables;
            var filter = {};
            var queryParts = query.split(":");
            filter.type = queryParts[0];
            filter.filter = queryParts[1];

            for (let i = 0; i<vars.length; i++) {
              if (vars[i].query == query) {
                var name = vars[i-1].current.value;
                if (filter.type = "sensor") {
                  Id = await this.prtgAPI.performPRTGAPIRequest("table.json","content=devices&columns=objid&filter_name=" + name).then(
                    function(PromiseValue){
                      return PromiseValue[0].objid;
                    }) 
                }
                else {
                  Id = await this.prtgAPI.performPRTGAPIRequest("table.json","content=groups&columns=objid&filter_name=" + name).then(
                    function(PromiseValue){
                      return PromiseValue[0].objid;
                    }) 
                } 
              }
            }
           
            if (queryParts[1] !== "*") {
              var queryFilter = queryParts[1].split("=");
              filter.filter = queryFilter[0];
              filter.filterExpression = this.templateSrv.replace(queryFilter[1]);
            }
            var items = void 0;
            
            if(filter.type == "group"){
              items = this.prtgAPI.performPRTGAPIRequest("table.json","content=groups&columns=objid,name,parentid&id=" + Id + "&filter_parentid=" + Id).then(
                function(PromiseValue){
                  return PromiseValue
                })
            }
            if(filter.type == "device"){
              items = this.prtgAPI.performPRTGAPIRequest("table.json","content=devices&columns=objid,name,parentid&id=" + Id + "&filter_parentid=" + Id).then(
                function(PromiseValue){
                  return PromiseValue
                })
            } 
            if(filter.type == "sensor"){
              items = this.prtgAPI.performPRTGAPIRequest("table.json","content=sensors&columns=objid,name,parentid&id=" + Id + "&filter_parentid=" + Id).then(
                function(PromiseValue){
                  return PromiseValue
                })
            }
            return items.then(function (metrics) {
              return _.map(metrics, function (metric) {
                return { text: metric.name, expandable: 0 };
              }, _this4);
            });
          }
        }, {
          key: "alertError",
          value: function alertError(message) {
            var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5000;

            this.alertSrv.set("PRTG API Error", message, "error", timeout);
          }
        }]);

        return PRTGDataSource;
      }());

      _export("PRTGDataSource", PRTGDataSource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
