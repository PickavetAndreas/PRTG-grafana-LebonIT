import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings, MutableDataFrame, FieldType, SelectableValue } from '@grafana/data';
import { getBackendSrv,getDataSourceSrv } from '@grafana/runtime';
import { MetricFindValue} from '@grafana/data'
import { MyQuery, MyDataSourceOptions, parameterOptions, monthsShortList } from './types';

var settingsData:any;

export class DataSource extends DataSourceApi<MyQuery,MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    settingsData = instanceSettings.jsonData;    
  }

  getGroups = (params:string) => {
    return this.apiRequest("table",params).then((response:any) => {
      var groupsData:any[] = []
      Object.entries(response.data.groups).map((responseItem:any) => {
        groupsData.push({item:responseItem[1].group, objid:responseItem[1].objid});
      })
      return groupsData
    })
    
  }

  getDevices = (params:string) => {
    return this.apiRequest("table",params).then((response:any) => {
      var deviceData:any[] = []
      Object.entries(response.data.devices).map((responseItem:any) => {
        deviceData.push({item:responseItem[1].device, objid:responseItem[1].objid});
      })
      return deviceData
    })
  }

  getSensors = (params:string) => {
    return this.apiRequest("table",params).then((response:any) => {
      var sensorData:any[] = []
      Object.entries(response.data.sensors).map((responseItem:any) => {
        sensorData.push({item:responseItem[1].sensor, objid:responseItem[1].objid});
      })
      return sensorData
    })
  }

  getChannels = (params:string) => {
    return this.apiRequest("chartlegend",params).then((response:any) => {
      var channelData:any[] = []
      Object.entries(response.data.items).map((responseItem:any) => {
        channelData.push({item:responseItem[1].name, objid:responseItem[1].unit});
      })
      return channelData
    })
  }

  getChildrenFrom = (parentId:string,type:string,verbose:boolean) => {
    var parameters:parameterOptions = {
      content:type + "s",
      columns: ["objid",type]
    }
    // channel responses have name columns, other responses have "type" columns
    if(type == "channel")
    {
      // parameters.columns = ["objid","name"]

      // for chartlegend
      parameters = { }
    }
    if(verbose)
    {
      parameters.id = parentId;
    }
    else
    {
      parameters.parent = parentId
      parameters.columns?.push("parentid")
    }
    return this.queryParameterBuilder(parameters);
  }
  
  queryParameterBuilder = (parameters:parameterOptions):string => {
    var query = "";
    Object.entries(parameters).map((param:any) => {
      switch (param[0]) {
        case "sdate":
          query += `&sdate=${param[1]}`
          break;
        case "edate":
          // avg = 0 for all data
          query += `&edate=${param[1]}&usecaption=1`
          break;
        case "content":
          query += `&content=${param[1]}` 
          break;
        case "id":
          query += `&id=${param[1]}`
          break;
        case "parent":
          query += `&filter_parentid=${param[1]}`
          break;
        case "avg":
          query += `&avg=${param[1]}`
          break;
        case "columns":
          query += "&columns="
          param[1].map((col:string) => {query += `${col},`})
          query = query.slice(0,-1)
          break;
        default:
          break;
      }
    })
    return query
  }

  metricFindQueryHelper = (content:string,parent:string,verbose:boolean) => {
    switch (content) {
      case "group":
        return this.getGroups(this.getChildrenFrom(parent,"group",verbose))
      case "device":
        return this.getDevices(this.getChildrenFrom(parent,"device",verbose))
      case "sensor":
        return this.getSensors(this.getChildrenFrom(parent,"sensor",verbose))
      case "channel":
        return this.getChannels(this.getChildrenFrom(parent,"channel",verbose))
      default:
        return this.getGroups("*");
        break;
    }
  }

  metricFindQuery(query:string, options:any) {
    var queryContent:string = query.split(":")[0];
    var queryParent:string = query.split(":")[1];
    if(queryParent == "*")
    {
      queryParent = "0"
    }
    if(queryParent.charAt(0) == "$")
    {
      queryParent = this.getCurrentVar(queryParent.substr(1)).value
    }
    return new Promise<MetricFindValue[]>((resolve, reject) => {
      this.metricFindQueryHelper(queryContent,queryParent,true).then((responseItems:any) => {
        const children:any[] = []
        Object.entries(responseItems).map((responseItem:any) => {
          children.push(
            {
              text: responseItem[1].item,
              value: responseItem[1].objid,
            }
          )
        })
        resolve(children)
      })
    });
  }

  grafDateToPrtgDate = (grafdate:any) => {
    // Split graf DateTime on space
    var grafSplitted:string[] = grafdate._d.toString().split(" ");
    // find corresponding month value
    var monthValue = monthsShortList.find(item => item.MonthName == grafSplitted[1])
    // replace ":" in time value to "-"
    var timeReplaced = grafSplitted[4].replace(":","-")

    var prtgDate = `${grafSplitted[3]}-${monthValue?.MonthIndex}-${grafSplitted[2]}-${timeReplaced}`
    return prtgDate
  }

  async query (options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> { 
    var mdfs:MutableDataFrame[] = []
    var  _this = this
    
    // set sdate, edate
    var paramOptions:parameterOptions = {
      sdate: this.grafDateToPrtgDate(options.range?.from),
      edate: this.grafDateToPrtgDate(options.range?.to),
    } 

    // loop over all targets
    for(var i=0; i<options.targets.length; i++) {         
      switch (options.targets[i].method) {
        case "table":
          var cols:string[] = ["name"]
          options.targets[i].tableColumnItemList?.map(function(colOption:SelectableValue) 
            {  cols.push(colOption.label!)
          })
          paramOptions = { content:options.targets[i].tableOption + "s", id:options.targets[i].selectedGroup?.id, columns:cols}
          var queryPar = this.queryParameterBuilder(paramOptions);
          const apiResTable = await _this.apiRequest(options.targets[i].method!,queryPar);

          var mdf = this.getTableDataframe(apiResTable, options.targets[i]);
          mdfs.push(mdf)
          break;
        case "historicdata":
           // set id and avg
          paramOptions.avg = options.targets[i].historicInterval
          paramOptions.id = options.targets[i].historicSensor!.id
          
          //get parametersstring fot apiRequest
          var queryPar = this.queryParameterBuilder(paramOptions); 
          const apiRes = await _this.apiRequest(options.targets[i].method!,queryPar);
    
          var mdf = this.getHistoricDataframe(apiRes,options.targets[i])
          mdfs.push(mdf)
          break;
        case "raw":
          const apiResRaw = await _this.apiRequestRaw(options.targets[i].rawURI!, options.targets[i].rawQueryText!)
          var mdf = this.getRawDataframe(apiResRaw, options.targets[i])
          mdfs.push(mdf)
          break;
        case "status":
          const apiResStatus = await _this.apiRequestRaw("status.json","")
          var mdf = this.getStatusDataframe(apiResStatus)
          mdfs.push(mdf)
        default:
          break;
      }
    }
    return Promise.all(mdfs).then(function (results) {
      return { data: mdfs };
    });
  } 

  getStatusDataframe = (apiResponse:any):MutableDataFrame => {
    var mdf = new MutableDataFrame({refId: "", name: "", fields: []})
    var statusEntries:any[] = []
    Object.entries(apiResponse.data).map((statusObj) => {
      statusEntries.push(statusObj)
    })
    mdf.addField({
      name: "status",
      values: statusEntries,
      type: FieldType.other
    })
    return mdf
  }

  getRawDataframe = (apiResponse:any,target:any):MutableDataFrame => {
    var mdf = new MutableDataFrame({refId: "", name: "" ,fields: []});
    Object.entries(apiResponse.data).map((data:any) => {
      mdf.addField({
        name:data[0],
        values:[data[1]],
        type: FieldType.other
      })
    })
    return mdf
  }

  getTableDataframe = (apiResponse:any,target:any):MutableDataFrame => {
    var requestedFilterItems:string[] = []
    var mdf = new MutableDataFrame({refId: "", name: "" ,fields: []});
    var requestedData:any[] = []

    target.tableFilterItemList.map(function(item:any) {
      requestedFilterItems.push(item.label)
    })

    apiResponse.data[target.tableOption + "s"].map((data:any) => {
      if(requestedFilterItems.includes(data.name)){
       requestedData.push(data)
      }
    })

    mdf.addField({
      name: target.tableOption + "s",
      values: requestedData,
      type: FieldType.other
    })
    return mdf
  }

  getHistoricDataframe = (apiResponse:any,target:any):MutableDataFrame => {
    // for data from requested channels 
    var requestedData:any = {}
    var timeList:number[] = []

    var requestedChannelsObj = target.historicChannelList
    requestedChannelsObj.map(function(requestedChannelsObjItem:any) {
      // declaring empty lists for requestedChannelData
      requestedData[requestedChannelsObjItem['label']] = []
    })

    var mdf = new MutableDataFrame({refId: "", name: "" ,fields: [],});
    apiResponse.data.histdata.map((historicData:any) => {
      // datetime
      var apiDate = historicData.datetime.split(" - ")[0]
      var apiDateFlipped = `${apiDate.split("/")[1]}/${apiDate.split("/")[0]}/${apiDate.split("/")[2]}`
      var correctDate = new Date(apiDateFlipped)
      timeList.push(correctDate.valueOf())

      // data
      requestedChannelsObj.map((obj:any) => {
        requestedData[obj.label].push(historicData[obj.label])
      })
    });

    mdf.addField(
      {
        name: "Time",
        values: timeList,
        type: FieldType.time,
      }
    )

    for(const [key] of Object.entries(requestedData)){
      mdf.addField(
          {
            name: `${key} ${requestedChannelsObj.find((item:any) => item.label == key).value}`,
            values: requestedData[key],
            type: FieldType.number
          }
        )
    }
    return mdf
  }

  async apiRequest(method:string,params:string) {
    // https://community.grafana.com/t/access-data-source-from-an-app-type-plugin-page/5223/7
    var apiUrl:string = `https://${settingsData.hostname}/api/${method}.json?username=${settingsData.username}&passhash=${settingsData.passhash}${params}`
    const apiData:Promise<any> = await getBackendSrv().datasourceRequest({url:apiUrl,method: 'GET'});
    return apiData
  }

  async apiRequestRaw(method:string,params:string) {
    // https://community.grafana.com/t/access-data-source-from-an-app-type-plugin-page/5223/7
    var apiUrl:string = `https://${settingsData.hostname}/api/${method}?username=${settingsData.username}&passhash=${settingsData.passhash}${params}`
    const apiData:Promise<any> = await getBackendSrv().datasourceRequest({url:apiUrl,method: 'GET'});
    return apiData
  }

  getCurrentVar(varName:string) {
    var dataSource:any = getDataSourceSrv() as unknown as DataSourceApi;
    var curVar:any = {}
    dataSource.templateSrv.variables.map((variable:any) => {
      if(variable.name == varName)
      {
        curVar = variable.current
      }
    })
    return curVar
  }

  async testDatasource() {
    this.query(settingsData.path)
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
