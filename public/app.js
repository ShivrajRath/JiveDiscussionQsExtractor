(function() {
    $("body").on("change", "#chk_submit", function(e) {
    	if($(this).is(':checked')){
			alert("checked");    		
    	}
    })
})()
