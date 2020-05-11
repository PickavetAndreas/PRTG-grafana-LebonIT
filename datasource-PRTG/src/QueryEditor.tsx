import defaults from 'lodash/defaults';

import React, { PureComponent } from 'react';
import { FormField,PanelOptionsGroup,CascaderOption,FormLabel,Select,QueryField,TypeaheadInput,TypeaheadOutput,CompletionItemGroup,CompletionItem,SuggestionsState} from '@grafana/ui';
import { QueryEditorProps, SelectableValue, DataSourceApi} from '@grafana/data';
import { DataSource } from './DataSource';
import { MyQuery, MyDataSourceOptions, methodList, tableOptions, defaultColumns, sensorColumns, deviceColumns, groupColumns, probeColumns} from './types';
import { getDataSourceSrv } from '@grafana/runtime'


type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

interface State {
  method:string,
  tableOption:string,
  selectedGroup?:{label:string,id:string},
  historicDevice?:{label:string,id:string},
  historicSensor?:{label:string,id:string},
  historicChannelList?: SelectableValue[],
  historicInterval?: number,
  tableFilterItemList?: SelectableValue[],
  tableColumnItemList?: SelectableValue[],
  rawURI?: string,
  rawQueryText?: string,
}

export class QueryEditor extends PureComponent<Props, State> {
  historicGroupList:CompletionItem[]=[]
  historicDeviceList:CompletionItem[]=[]
  historicSensorList:CompletionItem[]=[]
  historicChannelList:SelectableValue[]=[]


  constructor(props:any) {
    super(props);
    const query = defaults(this.props.query);
 
    const methodCurrent = methodList.find(item => item.value === query.method);
    const tableOptionsCurrent = tableOptions.find(item => item.value === query.tableOption);
    const selectedGroupCurrent = query.selectedGroup;
    const historicDeviceCurrent = query.historicDevice;
    const historicSensorCurrent = query.historicSensor;
    const historicSelectedChannelList = query.historicChannelList;
    const historicIntervalCurrent = query.historicInterval;
    const tableFilterItems = query.tableFilterItemList;
    const tableColumnItems = query.tableColumnItemList;
    const rawURI = query.rawURI;
    const rawQueryText = query.rawQueryText;

    this.state = {
      method: methodCurrent?.value,
      tableOption: tableOptionsCurrent?.value,
      selectedGroup: selectedGroupCurrent,
      historicDevice: historicDeviceCurrent,
      historicSensor: historicSensorCurrent,
      historicChannelList: historicSelectedChannelList,
      historicInterval: historicIntervalCurrent,
      tableColumnItemList: tableColumnItems,
      tableFilterItemList: tableFilterItems,
      rawQueryText: rawQueryText,
      rawURI: rawURI,
    }
  }

  onComponentDidMount() {}

  onScenarioChange = (item: SelectableValue<string>) => {
    const { onRunQuery } = this.props;
    this.props.onChange({
      ...this.props.query,
      method: item.value!,
    });
    onRunQuery();

    this.setState({
      method: item.value!
    })
  };
 
  renderFormFields = () => {
    switch (this.state.method) {
      case "table":
        return this.renderTabledataEditor();
      case "historicdata":
        return this.renderHistorydataEditor();
      case "raw":
        return this.renderRawdataEditor();
      default:
        return (<div></div>);
    }
  }

  renderRawdataEditor = () => {
    return (
      <div style={{
        display:"flex",
        justifyContent: "column"
      }}>
        <FormField label={"URI:"} onChange={(e)=>this.RawURIChange(e.target.value)} value={this.state.rawURI}></FormField>
        <FormField label={"Query Text:"} onChange={(e)=>this.RawQueryTextChange(e.target.value)} value={this.state.rawQueryText}></FormField>
      </div>
    );
  }

  RawURIChange = (input:any) => {
    this.props.query.rawURI = input
    this.setState({
      rawURI:input
    })
  }

  RawQueryTextChange = (input:any) => {
    this.props.query.rawQueryText = input
    this.setState({
      rawQueryText:input
    })
    this.props.onRunQuery()
  }

  renderTabledataEditor = () => {
    return (
      <div style={{
        display:"flex",
        justifyContent: "column"
      }}>
        <FormLabel width={5}>Content:</FormLabel>
        <Select options={tableOptions} value={tableOptions.find(item => item.value === this.props.query.tableOption)} onChange={(e)=>this.tableOptionChanged(e)}></Select>
        <FormLabel width={4}>From:</FormLabel>
          <div style={{minWidth:"100px"}}>
          {/* https://fossies.org/linux/grafana/public/app/plugins/datasource/prometheus/components/PromQueryField.tsx */}
            <QueryField
              query={this.state.selectedGroup? this.state.selectedGroup.label.toString() : "choose a Group"}
              onTypeahead={(e) => this.onTypeahead(e,"group")}
              onChange={(e) => this.findItemFromCompletionList(e,"group")}
              portalOrigin="PRTG"
              onWillApplySuggestion={this.willApplySuggestion}
              />
          </div>
          <FormLabel width={4}>Filter:</FormLabel>
          <Select isMulti={true} onChange={(e)=>this.tableFilterOptionsChange(e)} options={this.getTableFilterItemsOptions()} value={this.props.query.tableFilterItemList}></Select>
        <FormLabel width={5}>Columns:</FormLabel>
        <Select isMulti={true} onChange={(e)=>this.tableColumnOptionsChange(e)} options={this.getTableColumnOptions()} value={this.props.query.tableColumnItemList}></Select>
      </div>
    );
  }

  getTableColumnOptions = () => {
    var ColOpt:SelectableValue[] = defaultColumns
    switch (this.state.tableOption) {
      case "sensor":
        ColOpt = [...ColOpt,...sensorColumns]
        break;
      case "group":
        ColOpt = [...ColOpt,...groupColumns]
        break;
      case "device":
        ColOpt = [...ColOpt,...deviceColumns]
        break;
      case "probe":
        ColOpt = [...ColOpt,...probeColumns]
        break;
      default:
        break;
    }
    return ColOpt;
  } 


  tableOptionChanged = (input:SelectableValue<string>) => {
    this.props.query.tableOption = input.label
    this.setState({
      tableOption:input.label!
    });
  }

  renderHistorydataEditor = () => {
    return (
      <div style={{
        display:"flex",
        justifyContent:"column"
      }}>
        <FormLabel width={4}>Group:</FormLabel>     
        <div style={{minWidth:"100px"}}>
        {/* https://fossies.org/linux/grafana/public/app/plugins/datasource/prometheus/components/PromQueryField.tsx */}
          <QueryField
            query={this.state.selectedGroup? this.state.selectedGroup.label.toString() : "choose a Group"}
            onTypeahead={(e) => this.onTypeahead(e,"group")}
            onChange={(e)=>this.findItemFromCompletionList(e,"group")}
            portalOrigin="PRTG"
            onWillApplySuggestion={this.willApplySuggestion}
            />
        </div>
        <FormLabel width={4.5}>Device:</FormLabel>  
        <div style={{minWidth:"100px"}}>
          <QueryField
            query={this.state.historicDevice? this.state.historicDevice.label.toString() : "choose a Device"}
            onTypeahead={(e) => this.onTypeahead(e,"device")}
            onChange={(e)=>this.findItemFromCompletionList(e,"device")}
            portalOrigin="PRTG"
            onWillApplySuggestion={this.willApplySuggestion}
          />
        </div>
        <FormLabel width={4.5}>Sensor:</FormLabel>
        <div style={{minWidth:"100px"}}>
          <QueryField
            query={this.state.historicSensor? this.state.historicSensor.label.toString() : "choose a Sensor"}
            onTypeahead={(e) => this.onTypeahead(e,"sensor")}
            onChange={(e)=>this.findItemFromCompletionList(e,"sensor")}
            portalOrigin="PRTG"
            onWillApplySuggestion={this.willApplySuggestion}
          />
        </div>
        <FormLabel width={4.5}>Channels:</FormLabel>
        <div style={{minWidth:"100px"}}>
          <Select value={this.state.historicChannelList} isMulti={true} options={this.getHistoricChannelOptions()} onChange={(e) => this.historicChannelChange(e)}></Select>
        </div>
        <div>
          <FormField value={this.state.historicInterval} tooltip={"in minutes (all values = 0)"} label={"Interval:"} labelWidth={5} inputWidth={3} onChange={(e) => this.historicIntervalChange(e.target.value)}></FormField>
        </div>
      </div>
      
    );
  }

  historicIntervalChange = (interval:string) => {
    try {
      const intervalnr = Number(interval)
      this.setState({
        historicInterval:intervalnr
      })
      this.props.query.historicInterval = intervalnr;
      this.props.onRunQuery()
    } catch (error) {
      alert(error)
    }
  }

  getHistoricChannelOptions = () => {
    var ChannelSelectableValues:SelectableValue[] = []
    this.historicChannelList = []
    var sensorId = this.state.historicSensor? this.state.historicSensor.id : "0"
    this.props.datasource.metricFindQueryHelper("channel",sensorId,true).then((response:any) => {
      Object.entries(response).map((responseItem:any)=> {
        ChannelSelectableValues.push({
          label: responseItem[1].item,
          value: responseItem[1].objid,
        })
      });
    });
    return ChannelSelectableValues
  }

  getTableFilterItemsOptions = () => {
    var filterSelectableValues:SelectableValue[] = []
    try {
      var content = this.state.tableOption!
      var fromItem = this.state.selectedGroup?.id!
      this.props.datasource.metricFindQueryHelper(content,fromItem,true).then((response:any) => {
        Object.entries(response).map((responseItem:any)=> {
          filterSelectableValues.push({
            label: responseItem[1].item,
            value: responseItem[1].objid,
          })
        });
      })
    } catch (error) {
      
    }
    return filterSelectableValues
  }

  tableFilterOptionsChange = (input:SelectableValue) => {
    var filterItems:SelectableValue[] = []
    try {
      input.map((inputObj:SelectableValue) => {
        filterItems.push(inputObj);
      })
    } catch (error) {
      
    }
    this.setState({
      tableFilterItemList:filterItems
    })
    this.props.query.tableFilterItemList = filterItems
  }
  tableColumnOptionsChange = (input:SelectableValue) => {
    var columnItems:SelectableValue[] = []
    try {
      input.map((inputObj:SelectableValue) => {
        columnItems.push(inputObj);
      })
    } catch (error) {
      
    }
    this.setState({
      tableColumnItemList:columnItems
    })
    this.props.query.tableColumnItemList = columnItems
    this.props.onRunQuery()
  }


  historicChannelChange = (input:SelectableValue) => {
    var inputList:SelectableValue[] = []
    // inputvalue can be null (if no channels are selected)
    try {
      Object.entries(input).map((inputItem:any) => {
        inputList.push(inputItem[1])
      })
    } catch (error) {
      
    }
    this.setState({
      historicChannelList:inputList
    })
    this.props.query.historicChannelList = inputList
    this.props.onRunQuery()
  }

  willApplySuggestion = (suggestion: string, {typeaheadContext, typeaheadText }: SuggestionsState) : string => { 
    return suggestion + " ";
  }

  findItemFromCompletionList(label:string,content:string){
    label = label.substring(0,label.length -1)
    var item
    switch (content) {
      case "group":
        item = this.historicGroupList.find(item => item.label === label);
        break;
      case "device":
        item = this.historicDeviceList.find(item => item.label === label);
        break;
      case "sensor":
        item = this.historicSensorList.find(item => item.label === label);
      default:
        break;
    }
    
    if(item){
      switch (content) {
        case "group":
          this.setState({
            selectedGroup: {label:item?.label!,id:item?.detail!}
          })
          this.props.query.selectedGroup = {label:item?.label!,id:item?.detail!}
          break;
        case "device":
          this.setState({
            historicDevice: {label:item?.label!,id:item?.detail!}
          })
          this.props.query.historicDevice = {label:item?.label!,id:item?.detail!}
          break;
        case "sensor":
          this.setState({
            historicSensor: {label:item?.label!,id:item?.detail!}
          })
          this.props.query.historicSensor = {label:item?.label!,id:item?.detail!}
          this.getHistoricChannelOptions()
        default:
          break;
      }
    }
  }

  onTypeahead = async (typeahead: TypeaheadInput,content:string): Promise<TypeaheadOutput> => {
    var completionItemList:CompletionItem[] = []

    var parentId = "0"
    switch (content) {
      case "device":
        parentId = this.state.selectedGroup?.id!
        break;
      case "sensor":
        parentId = this.state.historicDevice?.id!
        break;
      default:
        break;
    }

    var datasourceReponse = await  this.props.datasource.metricFindQueryHelper(content,parentId,true);
    Object.entries(datasourceReponse).map((response:any)=> {
      completionItemList.push( {
        label:response[1].item,
        detail: response[1].objid,
      })
    });

    // Adding GrafanaVars as options
    var dataSource:any = getDataSourceSrv() as unknown as DataSourceApi;
    Object.entries(dataSource.templateSrv.variables).map((vari:any) => {
      completionItemList.push(
        {
          detail: vari[1].current.value,
          label:vari[1].label
        }
      )
    });
   
  
    var completionItemGroup:CompletionItemGroup = {label:content,items:completionItemList}

    switch (content) {
      case "group":
        this.historicGroupList = completionItemList
        break;
      case "device":
        this.historicDeviceList = completionItemList
        break;
      case "sensor":
        this.historicSensorList = completionItemList
        break;       
      default:
        break;
    }
   
    return {
      suggestions: [completionItemGroup]
    }
  };    

  getCascaderVars = (content:string, parent:string) => {
    var variables:CascaderOption[]=[]
    this.props.datasource.metricFindQueryHelper(content,parent,true).then((responses:any) => {
      Object.entries(responses).map((response:any) => {
        variables.push(
          {
            value: response[1].objid,
            label: response[1].item
          }
        )
      });
    });
    var dataSource:any = getDataSourceSrv() as unknown as DataSourceApi;
    Object.entries(dataSource.templateSrv.variables).map((vari:any) => {
    variables.push(
      {
        value: vari[1].current.value,
        label:vari[1].label
      }
    )
    });
    return variables
  }
 
  render = () => {
    const query = defaults(this.props.query);
    const methodCurrent = methodList.find(item => item.value === query.method);


    return (
      <div className="gf-form">
        <Select size={"sm"} options={methodList} value={methodCurrent} onChange={(e:any) => (this.onScenarioChange(e))}></Select>
        <PanelOptionsGroup>
          <this.renderFormFields/>     
        </PanelOptionsGroup>       
      </div>
    );
  }
}
