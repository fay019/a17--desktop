const { ipcRenderer, shell } = require( 'electron' )
const $ = require( 'jquery' )
const fs = require( 'fs' );
const path = require( 'path' );
const csv = require( 'jquery-csv' );
let edited = false;
let toExport = false;
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


/**
 * Drop listener
 */
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

    $.get( pathFiles[ 0 ], () => {
        let $table = $('table');
        if ( $table.length ) {
            if ( confirm( 'Are you sure you want to delete existing table?' ) === true ) {
                confirmationNew = true;
                $table.remove();
                tableConstructor();
            } else {
                confirmationNew = false;
            }
        } else {
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
                        // exportCsv();
                        toExport = true;
                    } )
                } );
                $( 'tr td' ).one( 'click', ( e ) => {
                    let $tag = $( e.target );
                    if ( $tag.children().length <= 0 ) {
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
                                    // exportCsv();
                                    toExport = true;
                                } ) )
                            }
                        } )
                    }
                } )
            }
        } )
} );
/**
 * Dragover Listener
 */
document.addEventListener( 'dragover', ( e ) => {
    e.preventDefault();
    e.stopPropagation();
} );

/**
 * write beautiful document size in format kb mb..
 * @param bytes {number}
 * @return {string}
 */
let sizeDisplay = ( bytes ) => {
    console.log('bytes: ', typeof bytes, bytes)
    let sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
    if ( bytes === 0 ) return '0 Byte';
    let i = parseInt( Math.floor( Math.log( bytes ) / Math.log( 1024 ) ) );
    return "size: " + Math.round( bytes / Math.pow( 1024, i ), 2 ) + ' ' + sizes[ i ];
}
/**
 * Table constructor
 */
let tableConstructor = () => {
    $( '<table class="table table-striped table-dark table-hover"><thead><tbody>' ).appendTo( '#table' );
    toExport = false;
}
/**
 * Add button export if the array is edited
 * @param cb
 */
let editedDisplay = ( cb ) => {
    !edited && $( '#export, #clear' ).css( 'display', 'inline-block' );
    edited = true;
    cb();
}

/**
 * convert data => string to object
 * @param data {string}
 * @return {string}
 */
let convertToCSV = function ( data ) {
    let myObject = typeof data != 'object' ? JSON.parse( data ) : data;
    let str = '';

    for ( var i = 0; i < myObject.length; i++ ) {
        var line = '';
        for ( var index in myObject[ i ] ) {
            if ( line !== '' ) line += ';'
            line += myObject[ i ][ index ];
        }
        str += line + '\r\n';
    }
    // in this time I write new file --- todo Ask Alex if I write the source file
    fs.writeFile( './datas/mycsvfile.csv', str, "utf8", err => {
        if ( err ) {
            console.error( err )
            return false;
        }
        alert( 'new file has been created  mycsvfile.csv' );
    } )
    return str;
}

/**
 * export btn listener
 *
 */
$( '#export' ).on( 'click', ( e ) => {
    e.stopPropagation();
    if ( toExport ) {
        convertToCSV( readTable() );
        toExport = false;
    }
} );

/**
 * read table and return json
 * @return {string}
 */
let readTable = () => {
    let header = [];
    let data = [];
    $( "table thead tr th" ).each( function ( i, v ) {
        header[ i ] = $( this ).text();
    } );
    header.pop();
    $( "table tbody tr" ).each( function ( i, v ) {
        data[ i ] = [];
        $( this ).children().each( function ( ii, vv ) {
            data[ i ][ ii ] = $( this ).text();
        } );
        data[ i ].pop();
    } )
    data.unshift( header );
    return JSON.stringify( data );
}


/**
 * Clear listener
 * remove table, hide btn and clear file infos
 */
$( '#clear' ).on( 'click', () => {
    if ( confirm( 'Are you sure you want clear the screen?' ) === true ) {
        $( 'table' ).remove();
        $( '#export, #clear' ).css( 'display', 'none' );
        $( '#file-name, #file-path, #file-size, #file-column, #file-row' ).html( '' );
        edited = false;
    }
} )