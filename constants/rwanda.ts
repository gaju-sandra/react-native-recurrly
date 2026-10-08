export type Province ={
    id: number;
    name: string;
};
export const PROVINCES: Province[] =[
    {id:1, name: 'Kigali City'},
{id:2, name: 'Northern Province'},
{id:3, name: 'Southern Province'},
{id:4, name: 'Eastern Province'},
{id:5, name: 'Western Province'},
];

export type District={
id:number;
name:string;
province_id:number;
};

export const DISTRICTS: District[] =[
    {id:101, name:'Gasabo', province_id:1},
    {id:103, name:'Nyarugenge', province_id:1},
    {id:102, name:'Kicukiro', province_id:1},
    {id:201, name:'Burera', province_id:2},
    {id:202, name:'Gakenke', province_id:2},
    {id:203, name:'Gicumbi', province_id:2},
    {id:204, name:'Musanze', province_id:2},
    {id:205, name:'Rulindo', province_id:2},
    {id:301, name:'Gisagara', province_id:3},
    {id:302, name:'Huye', province_id:3},
    {id:303, name:'Kamonyi', province_id:3},
    {id:304, name:'Muhanga', province_id:3},
    {id:305, name:'Nyamagabe', province_id:3},
    {id:306, name:'Nyanza', province_id:3},
    {id:307, name:'Nyaruguru', province_id:3},
    {id:308, name:'Ruhango', province_id:3},
    {id:401, name:'Bugesera', province_id:4},
    {id:402, name:'Gatsibo', province_id:4},
    {id:403, name:'Kayonza', province_id:4},
    {id:404, name:'Kirehe', province_id:4},
    {id:405, name:'Ngoma', province_id:4},
    {id:406, name:'Nyagatare', province_id:4},
    {id:407, name:'Rwamagana', province_id:4},
    {id:501, name:'Karongi', province_id:5},
    {id:502, name:'Ngororero', province_id:5},
    {id:503, name:'Nyabihu', province_id:5},
    {id:504, name:'Nyamasheke', province_id:5},
    {id:505, name:'Rubavu', province_id:5},
    {id:506, name:'Rusizi', province_id:5},
    {id:507, name:'Rutsiro', province_id:5},
];