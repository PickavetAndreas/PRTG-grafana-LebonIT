import { DataQuery, DataSourceJsonData, SelectableValue } from '@grafana/data';

export interface MyQuery extends DataQuery {
  method?: string;
  tableOption?: string;
  selectedGroup?: {label:string,id:string};
  historicDevice?: {label:string,id:string};
  historicSensor?: {label:string,id:string};
  historicChannelList?: SelectableValue[];
  historicInterval?: number;
  tableFilterItemList?: SelectableValue[];
  tableColumnItemList?: SelectableValue[];
  rawURI?: string,
  rawQueryText?: string,
}

export interface MyDataSourceOptions extends DataSourceJsonData {
  path?: string;
  hostname?: string;
  username?: string;
  passhash?: string;
};

export const methodList:SelectableValue[] = 
[
  {
    label: "table",
    value: "table"
  },{
    label: "status",
    value: "status"
  },{
    label: "historicdata",
    value: "historicdata"
  },
  {
    label:"raw",
    value:"raw"
  }
];

export const tableOptions:SelectableValue[] = 
[
  {
    label: "group",
    value: "group"
  },{
    label: "device",
    value: "device"
  },{
    label: "sensor",
    value: "sensor"
  }
];

export interface parameterOptions {
  content?:string,
  id?:string,
  parent?:string,
  columns?:string[],
  sdate?:string,
  edate?:string,
  avg?:number,
}

export interface monthsShort {
  MonthName:string,
  MonthIndex:string,
}

export const monthsShortList:monthsShort[] = 
[
  {
    MonthName: "Jan",
    MonthIndex: "01",
  },
  {
    MonthName: "Feb",
    MonthIndex: "02",
  },
  {
    MonthName: "Mar",
    MonthIndex: "03",
  },
  {
    MonthName: "Apr",
    MonthIndex: "04",
  },
  {
    MonthName: "May",
    MonthIndex: "05",
  },
  {
    MonthName: "Jun",
    MonthIndex: "06",
  },
  {
    MonthName: "Jul",
    MonthIndex: "07",
  },
  {
    MonthName: "Aug",
    MonthIndex: "08",
  },
  {
    MonthName: "Sep",
    MonthIndex: "09",
  },
  {
    MonthName: "Oct",
    MonthIndex: "10",
  },
  {
    MonthName: "Nov",
    MonthIndex: "11",
  },
  {
    MonthName: "Dec",
    MonthIndex: "12",
  }
]

export const defaultColumns:SelectableValue[] = [
  {
    label: "objid",
    value:"objid"
  },
  {
    label: "type",
    value: "type"
  },
  {
    label: "active",
    value:"active"
  },
  {
    label: "tags",
    value:"tags"
  },
  {
    label:"probe",
    value:"probe"
  },
  {
    label:"notifiesx",
    value:"notifiesx"
  },
  {
    label:"intervalx",
    value:"intervalx"
  },
  {
    label:"status",
    value:"status"
  },
  {
    label:"message",
    value:"message"
  },
  {
    label:"priority",
    value:"priority"
  },
  {
    label:"upsens",
    value:"upsens"
  },
  {
    label:"downsens",
    value:"downsens"
  },
  {
    label:"downacksens",
    value:"downacksens"
  },
  {
    label:"partialdownsens",
    value:"partialdownsens"
  },
  {
    label:"pausedsens",
    value:"pausedsens"
  },
  {
    label:"warnsens",
    value:"warnsens"
  },
  {
    label:"unusualsens",
    value:"unusualsens"
  },
  {
    label:"totalsens",
    value:"totalsens"
  },
  {
    label:"schedule",
    value:"schedule"
  },
  {
    label:"comments",
    value:"comments"
  },
  {
    label:"basetype",
    value:"basetype"
  },
  {
    label:"baselink",
    value:"baselink"
  },
  {
    label:"parentid",
    value:"parentid"
  },
  {
    label:"probegroupdevice",
    value:"probegroupdevice"
  }
]

export const sensorColumns:SelectableValue[] = [
  {
    label:"downtime",
    value:"downtime"
  },
  {
    label:"downtimesince",
    value:"downtimesince"
  },
  {
    label:"downtimetime",
    value:"downtimetime"
  },
  {
    label:"uptime",
    value:"uptime"
  },
  {
    label:"uptimesince",
    value:"uptimesince"
  },
  {
    label:"knowntime",
    value:"kwowntime"
  },
  {
    label:"cumtime",
    value:"cumtime"
  },
  {
    label:"sensor",
    value:"sensor"
  },
  {
    label:"interval",
    value:"interval"
  },
  {
    label:"lastcheck",
    value:"lastcheck"
  },
  {
    label:"lastup",
    value:"lastup"
  },
  {
    label:"lastdown",
    value:"lastdown"
  },
  {
    label:"device",
    value:"device"
  },
  {
    label:"group",
    value:"group"
  },
  {
    label:"grpdev",
    value:"grpdev"
  },
  {
    label:"lastvalue",
    value:"lastvalue"
  },
  {
    label:"size",
    value:"size"
  }
]

export const deviceColumns:SelectableValue[] = [
  {
    label:"device",
    value:"device"
  },
  {
    label:"group",
    value:"group"
  },
  {
    label:"host",
    value:"host"
  },
  {
    label:"icon",
    value:"icon"
  },
]

export const groupColumns:SelectableValue[] = [
  {
    label:"group",
    value:"group"
  },
  {
    label:"condition",
    value:"condition"
  },
  {
    label:"groupnum",
    value:"groupnum"
  },
  {
    label:"devicenum",
    value:"devicenum"
  },
]

export const probeColumns:SelectableValue[] = [
  {
    label:"condition",
    value:"condition"
  },
  {
    label:"groupnum",
    value:"groupnum"
  },
  {
    label:"devicenum",
    value:"devicenum"
  },
]