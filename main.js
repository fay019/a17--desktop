const { app, BrowserWindow, screen, Menu, shell, ipcMain } = require( 'electron' );


// config
let meinFenster;
let myHeight, myWidth, myX, myY;
const DEVMODE = false;

/**
 * User Menu
 * @type {[{label: string, click: click},{label: string, click: click}]}
 */
let meinMenu = [
    {
        label:'CSV-editor', click:() => {
            meinFenster.loadFile( 'views/index.html' ); // ???
            shell.beep();
        }
    },
    {
        label:'Credit', click:() => {
            meinFenster.loadFile( 'views/credit.html' );
            shell.beep();
        }
    }
];
/**
 * Dev Menu
 * @type {[{submenu: [{label: string, click: click},{role: string, label: string}], label: string},{label: string, click: click},{label: string, click: click}]}
 */
let meinDevMenu = [
    {
        label:'Meine Applikation', submenu:[
            {
                label:'Beenden', click:() => {
                    app.quit();
                    shell.beep();
                }
            },
            {
                label:'Dev-Tools', role:'toggleDevTools'
            },
        ]
    },
    {
        label:'Home', click:() => {
            meinFenster.loadFile( 'views/index.html' ); // ???
            shell.beep();
        }
    },
    {
        label:'Credit', click:() => {
            meinFenster.loadFile( 'views/credit.html' );
            shell.beep();
        }
    }
];

//end config

const starteApplikation = () => {
    let factor = screen.getAllDisplays();
    myHeight = factor[ 1 ].size.height;
    myWidth = 1250;
    myX = factor[ 1 ].size.width - myWidth;
    myY = 0;
    meinFenster = new BrowserWindow( {
        width:1250,
        height:myHeight,
        x:myX,
        y:myY,
        // resizable:false,
        movable:true,
        //transparent: true,
        frame:true,
        icon:__dirname + '/assets/csv-icon.png',
        webPreferences:{
            nodeIntegration:true, //standard false
            contextIsolation:false,
            devTools:DEVMODE // false in published
        },
        //icon: __dirname
    } );
    meinFenster.loadFile( 'views/index.html' );
    if ( DEVMODE ) {
        meinFenster.webContents.openDevTools(); // auto open devtools
        Menu.setApplicationMenu( Menu.buildFromTemplate( meinDevMenu ) );
        meinFenster.setAlwaysOnTop( true );
    }else {
        Menu.setApplicationMenu( Menu.buildFromTemplate( meinMenu ) );
    }
};


app.on( 'ready', starteApplikation );

//- MacOS
app.on( 'window-all-closed', () => {
    app.quit(); //Beende Applikation
} )
app.on( 'active', starteApplikation )

//+ MacOS

ipcMain.on( 'closeApplication', () => {
    app.quit(); //Beende Applikation
    shell.beep();
} )
