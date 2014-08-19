$(document).ready(function() {
    // Save username and jive url fields to localstorage
    $("#excelForm").submit(function(event) {
        var el = $(this)
        var uname = el.find('#jiveusername').val();
        var placeurl = el.find('#placeurl').val();

        localStorage.setItem("uname", uname);
        localStorage.setItem("placeurl", placeurl);
    });
    populateExcelFormFields();
});

/**
 * Populate username and jive url fields from localstorage
 */
function populateExcelFormFields() {
    $('#jiveusername').val(localStorage.getItem("uname"));
    $('#placeurl').val(localStorage.getItem("placeurl"));
}
