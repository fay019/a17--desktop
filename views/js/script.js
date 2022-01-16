const { ipcRenderer, shell } = require( 'electron' )
const $ = require( 'jquery' )
const fs = require( 'fs' );
const path = require( 'path' );
const csv = require( 'jquery-csv' );
let edited = false;
let confirmationNew = false;

/////////////// App CTRL  ////////////////////
$( '#closeApp' ).on( 'click', () => {
    //app.quit(); // geht nicht
    // dem main-prozess mitteilen, dass app beendet werden
    ipcRenderer.send( 'closeApplication' );
} )
$( '#reloadApp' ).on( 'click', () => {
    //console.log('Reload clicked');
    window.location.reload();
    shell.beep()
} );
/////////////// END App CTRL  ////////////////////


document.addEventListener( 'drop', ( event ) => {
    event.preventDefault();
    event.stopPropagation();
    let pathFiles = [];
    let result = [];
    let filleName = [];
    let filleSize = [];
    let iconEdit = '<img src="./icons/delete.svg" alt="delete">'


    for ( const f of event.dataTransfer.files ) {
        // Using the path attribute to get absolute file path
        // console.log('File Path of dragged files: ', f.path)
        pathFiles.push( f.path )
        filleName.push( f.name );
        filleSize.push( f.size );
    }

    $.get( pathFiles[ 0 ], ( data ) => {
        if ( $( 'table' ).length ) {
            if ( confirm( 'Are you sure you want to delete existing table?' ) === true ) {
                confirmationNew = true;
                $( 'table' ).remove();
                tableConstructor();
            } else {
                confirmationNew = false;
            }
        } else {
            console.log( '1st time' )
            confirmationNew = true;
            tableConstructor();
        }

    } )
        .done( ( data ) => {
            if ( confirmationNew ) {
                $( '#file-name' ).html( "name: " + filleName[ 0 ] );
                $( '#file-path' ).html( "path: " + pathFiles[ 0 ] );
                $( '#file-size' ).html( sizeDisplay( filleSize[ 0 ] ) );

                csv.toArrays( data, {}, function ( err, data ) {
                    if ( err ) {
                        console.log( err );
                    }
                    for ( let i = 0, len = data.length; i < len; i++ ) {
                        let temp = data[ i ][ 0 ].split( ";" );
                        result.push( temp );
                    }
                } );

                $( '#file-column' ).html( "column: " + result[ 0 ].length );
                $( '#file-row' ).html( "row: " + ( result.length - 1 ) );

                for ( let i = 0; i < result.length; i++ ) {
                    if ( i === 0 ) {
                        //let $thead = $('<thead>')
                        let $tr = $( '<tr>' );
                        $( '<th>' ).html( result[ i ][ 0 ] ).appendTo( $tr );
                        $( '<th>' ).html( result[ i ][ 1 ] ).appendTo( $tr );
                        $( '<th>' ).html( result[ i ][ 2 ] ).appendTo( $tr );
                        $( '<th>' ).html( result[ i ][ 3 ] ).appendTo( $tr );
                        $( '<th>' ).html( result[ i ][ 4 ] ).appendTo( $tr );
                        $( '<th>' ).html( result[ i ][ 5 ] ).appendTo( $tr );
                        $( '<th>' ).html( 'Action' ).appendTo( $tr );

                        //$thead.appendTo('table');
                        $( $tr ).appendTo( 'thead' );
                    } else {
                        let $tr = $( '<tr>' );
                        $( '<th>' ).html( result[ i ][ 0 ] ).appendTo( $tr );
                        $( '<td>' ).html( result[ i ][ 1 ] ).appendTo( $tr );
                        $( '<td>' ).html( result[ i ][ 2 ] ).appendTo( $tr );
                        $( '<td>' ).html( result[ i ][ 3 ] ).appendTo( $tr );
                        $( '<td>' ).html( result[ i ][ 4 ] ).appendTo( $tr );
                        $( '<td>' ).html( result[ i ][ 5 ] ).appendTo( $tr );
                        $( '<td>' ).html( iconEdit ).appendTo( $tr );
                        $( $tr ).appendTo( 'tbody' );
                    }
                }
                $( "img[alt='delete']" ).on( 'click', ( e ) => {
                    $( e.target ).parent().parent().remove();
                    editedDisplay( () => {
                        exportCsv()
                    } )
                } );
                $( 'tr td' ).one( 'click', ( e ) => {
                    let $tag = $( e.target );
                    let tempValue = $tag.text();
                    let tempValue1;
                    $tag.html( '' );
                    $tag.append( `<input type="text" value="${tempValue}">` );
                    $tag.children().focus();
                    $( document ).on( 'click', ( event ) => {
                        if ( $( event.target ).closest( $tag ).length === 0 ) {
                            tempValue1 = $tag.children().val();
                            $tag.children().remove();
                            $tag.html( tempValue1 );
                            ( tempValue !== tempValue1 ) && ( editedDisplay( () => {
                                exportCsv()
                            } ) )
                        }
                    } )
                } )
            }
        } )
} );

document.addEventListener( 'dragover', ( e ) => {
    e.preventDefault();
    e.stopPropagation();
} );


let sizeDisplay = ( bytes ) => {
    let sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
    if ( bytes === 0 ) return '0 Byte';
    let i = parseInt( Math.floor( Math.log( bytes ) / Math.log( 1024 ) ) );
    return "size: " + Math.round( bytes / Math.pow( 1024, i ), 2 ) + ' ' + sizes[ i ];
}
let tableConstructor = () => {
    $( '<table class="table table-striped table-dark table-hover"><thead><tbody>' ).appendTo( '#table' );
}
let editedDisplay = ( cb ) => {
    !edited && $( '<div id="export">export to CSV</div>' ).appendTo( '#file-infos' );
    edited = true;
    cb();
}
let exportCsv = () => {
    $( '#export' ).on( 'click', ( e ) => {
        console.log( 'export clicked ', e );
        let header = [];

        $( "table thead tr th" ).each( function ( i, v ) {
            header[ i ] = $( this ).text();
        } );
        header.pop();

        let data = [];

        $( "table tbody tr" ).each( function ( i, v ) {
            data[ i ] = [];
            $( this ).children().each( function ( ii, vv ) {
                data[ i ][ ii ] = $( this ).text();
            } );
            data[ i ].pop();
        } )
        data.unshift( header );
        let myJson = JSON.stringify( data );
        //myJson = myJson.substring(1, myJson.length-1)
        console.log( myJson )
        console.log( convertToCSV( myJson ) )

    } );
};

let convertToCSV = function ( objArray ) {
    var array = typeof objArray != 'object' ? JSON.parse( objArray ) : objArray;
    var str = '';

    for ( var i = 0; i < array.length; i++ ) {
        var line = '';
        for ( var index in array[ i ] ) {
            if ( line != '' ) line += ';'

            line += array[ i ][ index ];
        }

        str += line + '\r\n';
    }
    fs.writeFile( './datas/mycsvfile.csv', str, "utf8", err => {
        if ( err ) {
            console.error( err )
            return false;
        }
        alert( 'new file has been created  mycsvfile.csv' );
    } )
    return str;
}