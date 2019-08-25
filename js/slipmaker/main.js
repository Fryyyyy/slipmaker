/* jslint browser: true */
/* global $, jQuery, jsPDF */

// global timeout filters
var slipChangeTimer = null;
var pdfChangeTimer = null;

// When the page loads, generate a blank deck list preview
$(document).ready(function() {
    // bind events to all the input fields on the left side, to generate a PDF on change
    $('div.left input, div.left textarea').on('input', pdfChangeWait);
    $("#download").button();

    // detect browser PDF support
    detectPDFPreviewSupport();

    generateSlipPDF();
});

// Blocks updates to the PDF
function pdfChangeWait() {
    // Wait 1500 milliseconds to generate a new PDF
    if (pdfChangeTimer) { clearTimeout(pdfChangeTimer); }
    pdfChangeTimer = setTimeout(generateSlipPDF, 1500);
}

// Detect if there is PDF support for the autopreview
function detectPDFPreviewSupport() {
    showpreview = false;

    // Safari and Chrome have application/pdf in navigator.mimeTypes
    if (navigator.mimeTypes['application/pdf'] != undefined) { showpreview = true; }

    // Firefox desktop uses pdf.js, but not mobile or tablet
    if (navigator.userAgent.indexOf('Firefox') != -1) {
        if ((navigator.userAgent.indexOf('Mobile') == -1) && (navigator.userAgent.indexOf('Tablet') == -1)) { showpreview = true; }
        else { showpreview = false; } // have to reset it, as FF Mobile application/pdf listed, but not supported (wtf?)
    }
}

String.prototype.capitalize = function() {
    // return this.replace( /(^|\s)([a-z])/g, function(m,p1,p2) { return p1+p2.toUpperCase(); } );
    return this.replace( /(^)([a-z])/g, function(m,p1,p2) { return p1+p2.toUpperCase(); } ); // 1st char
};

function generateSlipPDF(outputtype) {
    // default type is dataurlstring (live preview)
    // stupid shitty javascript and its lack of default arguments
    outputtype = typeof outputtype !== 'undefined' ? outputtype : 'dataurlstring';

    // clear the input timeout before we can generate the PDF
    pdfChangeTimer = null;

    // don't generate the preview if showpreview == false
    if ((outputtype == 'dataurlstring') && (showpreview == false)) {
        $("#decklistpreview").empty();
        $("#decklistpreview").html("Automatic decklist preview only supported in non-mobile Firefox, Safari, and Chrome.<br /><br />");
    }

    dl = generateSlipLayout();
    addDataToSlip(dl);

   // Output the dl as a blob to add to the DOM
   if (outputtype == 'dataurlstring') {
        domdl = dl.output('dataurlstring');

        // Put the DOM into the live preview iframe
        $('iframe').attr('src', domdl);
    } else {
        filename = ($.grep([$("#firstname").val().capitalize(), $("#lastname").val().capitalize(), $("#event").val().capitalize(), "decklist"], Boolean).join(" ")) + '.pdf';
        savePDF(dl, filename);
    }
}

// Generates the part of the PDF that never changes (lines, boxes, etc.)
function generateSlipLayout() {
    // Create a new slip
    s = new jsPDF('portrait', 'pt', 'a4');

    addTemplateToSlip(s);

    // Set iFrame W/H
    $("#decklist")[0].height = "580";
    $("#decklist")[0].width = "440";

    return(s);
}

// Generates the part of the PDF that never changes (lines, boxes, etc.)
function addTemplateToSlip(dl) {
    dl.setLineWidth(1);
    dl.setFont('courier');
    dl.setFontSize(12);

    var i;
    var y = 20;
    var x = 25;

    // Begin slip
    for (i = 0; i < 4; i++) {   
        // Dashed line
        dl.setLineDash([5], 0);
        dl.line(x, y, 550, y);
        dl.setLineDash();
        
        y += 20;

        // Round ______
        dl.text('Round', x, y);
        y += 3;
        dl.line(67, y, 140, y);

        y += 20-3;

        // Table ______
        dl.text('Table', x, y);
        y += 3;
        dl.line(67, y, 140, y);
        y -= 3;

        // Wins Draws Drop
        dl.text('Wins', 325, y);
        dl.text('Draws', 385, y);
        dl.text('Drop?', 445, y);

        y += 20;

        // Player 1:
        dl.text('Player 1:', x, y);
        // Wins & Drop Line
        dl.line(325, y, 365, y);
        dl.line(445, y, 485, y);
        y += 15;
        // DCI Number:
        dl.text('DCI Number:', x, y);
        y += 15;
        // Points:
        dl.text('Points:', x, y);
        // Draws Line
        dl.line(385, y, 425, y);

        y += 25;

        // Player 2:
        dl.text('Player 2:', x, y);
        // Wins & Drop Line
        dl.line(325, y, 365, y);
        dl.line(445, y, 485, y);
        y += 15;
        // DCI Number:
        dl.text('DCI Number:', x, y);
        y += 15;
        // Points:
        dl.text('Points:', x, y);

        y += 25;

        // PlaneswalkerPoints
        dl.text('http://www.PlaneswalkerPoints.com', x, y);
        // Sig lines
        y -= 10;
        dl.line(325, y, 415, y);
        dl.line(455, y, 545, y);
        y += 10;
        // Player 1 // Player 2
        dl.text('Player 1', 325, y);
        dl.text('Player 2', 455, y);

        y += 15;
    }
    // Final dashed line
    dl.setLineDash([5], 0);
    dl.line(x, y, 550, y);
    dl.setLineDash();
}

function addDataToSlip(dl) {
    var y = 40;

    roundno = $("#eventround").val();
    dl.text(roundno, 75, y);

    y += 20;

    tableno = $("#eventtable").val();
    dl.text(tableno, 75, y);

    y += 20;

    p1name = toTitleCase($("#p1name").val());
    dl.text(p1name, 95, y);

    y += 15;

    p1dci = $("#p1dci").val();
    dl.text(p1dci, 105, y);

    y += 15;

    p1points = $("#p1points").val();
    dl.text(p1points, 80, y);

    y += 25;

    p2name = toTitleCase($("#p2name").val());
    dl.text(p2name, 95, y);

    y += 15;

    p2dci = $("#p2dci").val();
    dl.text(p2dci, 105, y);

    y += 15;

    p2points = $("#p2points").val();
    dl.text(p2points, 80, y);
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}