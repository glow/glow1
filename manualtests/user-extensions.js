// Collates data from each test to build report
Selenium.prototype.doAddTestResult = function() {
    
	if (!window.glowReport) window.glowReport = '';

	var iframeDoc = getIframeDocument('testFrame');
	if (!iframeDoc) return false;

	arrTR = iframeDoc.getElementsByTagName('TABLE')[0].getElementsByTagName('TR');

	var report = '<tr><td>' + arrTR[0].cells[0].innerHTML + '</td>';

	report += '<td>' + arrTR[6].cells[2].innerHTML + '</td>';

	var comment = (arrTR[7].cells[2].innerHTML == 'Write a comment...') ? '' : arrTR[8].cells[2].innerHTML.replace(/QQQQQ/g, '<br />');

	report += '<td>' + comment + '</td></tr>';

	window.glowReport += report;

};

// Builds report
Selenium.prototype.doBuildReport = function() {

	window.glowReport = '<dl><dt>User Agent</dt><dd>' + navigator.userAgent + '</dd><dt>Loading Method</dt><dd>' + window.top.window.translateLoadingMethod() + '</dd></dl><table border="1"><thead><tr><th>Test name</th><th>Result</th><th>Comment</th></tr></thead><tbody>' + window.glowReport + '</tbody></table>';

	var iframeDoc = getIframeDocument('selenium_myiframe');
	if (!iframeDoc) return false;
	
	iframeDoc.getElementsByTagName('BODY')[0].innerHTML = window.glowReport;

	window.glowReport = '';

}

// Helper func to get document object from iFrame.
function getIframeDocument(iframeId)
{
	return document.getElementById(iframeId).contentWindow.document;
	
	// If none of the IF statements catch then return false.
	//console.error('ERROR with REPORT BUILER');
	return false;
}