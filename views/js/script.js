const { ipcRenderer, shell } = require( 'electron' );
const $ = require( 'jquery' )
const fs = require( 'fs' );
const csv = require( 'jquery-csv' );
const tablesorter = require( 'tablesorter' );
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
    let iconDelete = '<i class="bi bi-trash"></i>'


    for ( const f of event.dataTransfer.files ) {
        // Using the path attribute to get absolute file path
        // console.log('File Path of dragged files: ', f.path)
        pathFiles.push( f.path )
        filleName.push( f.name );
        filleSize.push( f.size );
    }

    $.get( pathFiles[ 0 ], () => {
        let $table = $( 'table' );
        if ( $table.length ) {
            if ( confirm( 'Are you sure you want to delete existing table?' )) {
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
                $( '#csvImg' ).addClass( 'd-none' );

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
                        $( '<td>' ).html( iconDelete ).appendTo( $tr );
                        $( $tr ).appendTo( 'tbody' );
                    }
                }
                $( 'table' ).tablesorter();
                ///////////////// Search ////////////////
                $( "#search-input" ).tableSearch();
                ///////////////// End Search ////////////////
                ///////////////// Delete ////////////////
                $('.bi-search').rowDelete();
                ///////////////// end Delete ////////////////
                ///////////////// Edit ////////////////
                $( 'tr td' ).makeEditable();
                ///////////////// End Edit ////////////////
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
    $( '#search' ).removeClass( 'd-none' )
    toExport = false;
}
/**
 * Add button export if the array is edited
 * @param cb
 */
let editedDisplay = ( cb ) => {
    !edited && $( '#export, #clear' ).show();
    edited = true;
    cb();
    return false;
}

/**
 * convert data => object to string
 * @param data {array}
 * @return {string}
 */
let convertToCSV = function ( data ) {
    let str = '';
    let fileName = $( '#file-name' ).html();
    let dir = './datas';
    for ( var i = 0; i < data.length; i++ ) {
        var line = '';
        for ( var index in data[ i ] ) {
            if ( line !== '' ) line += ';'
            line += data[ i ][ index ];
        }
        str += line + '\r\n';
    }
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    fs.writeFile( `./datas/MOCK_DATA.csv`, str, "utf8", err => {

        if ( err ) {
            console.error( err )
            return false;
        }
        alert( 'file was updated '+fileName );
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
 * read table and return array
 * @return {array}
 */
let readTable = () => {
    let header = [];
    let data = [];
    let count = 0;
    $( "table thead tr th" ).each( function ( i, v ) {
        header[ i ] = $( this ).text();
    } );
    header.pop();
    $( "table tbody tr" ).each( function ( i, v ) {
        if ( $( v ).is( ':visible' ) ) {
            data[ count ] = [];
            $( this ).children().each( function ( ii, vv ) {
                data[ count ][ ii ] = $( this ).text();
            } );
            data[ count++ ].pop();
        }
    } )
    data.unshift( header );
    return data ;
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
        $( '#search' ).addClass( 'd-none' );
        $( '#csvImg' ).removeClass( 'd-none' );
        edited = false;
    }
} )

/**
 *  $.fn ==> jQuery.Prototype // nice thing
 *  row - cell editor
 *  with enter confirm // big and pad enter
 *  if you click outside and the input has been changed, we override the value
 * @return {$}
 */
$.fn.makeEditable = function() {
    $(this).on('click',function(){
        if($(this).children().length <= 0) {
            if($(this).find('input').is(':focus')) return this;
            let cell = $(this);
            let content = $( this ).html();
            $(this).html('<input type="text" value="' + $(this).html() + '" />')
                .find('input')
                .trigger('focus')
                .on({
                    'blur': function(){
                        if ( content === $(this).val()) {
                            $(this).trigger('closeEditable');
                        } else {
                            $(this).trigger('saveEditable');
                        }
                    },
                    'keyup':function(e){
                        if(e.which === 13){ // enter
                            $(this).trigger('saveEditable');
                        } else if(e.which === 27){ // escape
                            $(this).trigger('closeEditable');
                        }
                    },
                    'closeEditable':function(){
                        cell.html(content);
                    },
                    'saveEditable':function(){
                        content = $(this).val();
                        $(this).trigger('closeEditable');
                        editedDisplay(()=>{toExport = true;});
                    }
                });
        }
        return false;
    });
    return this;
}


/**
 * remove row by click on trash icon
 */
$.fn.rowDelete = function() {
    $( ".bi-trash" ).on( 'click',function ( ) {
        let rowId = $( this ).parent().parent().children()[ 0 ].innerHTML; // row Id
        let rowName = $( this ).parent().parent().children()[ 1 ].innerHTML; // row Name
        let rowLastName = $( this ).parent().parent().children()[ 2 ].innerHTML; // row Last name
        // Ask confirmation
        let agree = confirm( `Are you sure you want to delete id: ${rowId}, name: ${rowName} ${rowLastName}` );
        if ( agree ) {
            $( this ).closest('tr').hide(); // remove row after confirm
            editedDisplay( () => { // display export adn clear btn
                toExport = true;
            } );
        }
    } );
}

/**
 * Search input
 */
$.fn.tableSearch = function () {
    $( "#search-input" ).on( "keyup", function () {
        editedDisplay( () => { // display export adn clear btn
            toExport = true;
        } )
        let value = $( this ).val().toLowerCase();
        $( "tbody tr" ).filter( function () {
            $( this ).toggle( $( this ).text().toLowerCase().indexOf( value ) > -1 )
        } );
    } );
}
///////////////// End Search ////////////////