var PREVIEW_MODE = function(){
	var $preview_bar;
	var $window;
	//var show = false;
	//var hide = true;
	//var hide_timeout = {};
	//var auto_hide_timeout = {};
	var init = function(){
		$preview_bar = $('#preview_mode_bar');
		$window = $(window);
	//	mouseTrigger();
	//	showBar();
	};

	var publishDesignTemp = function(){
		$.ajax({
			type: 'POST',
			data: {'mode':'publish'},
			url: ('/admin/ajax/publish_design_temp.cm'),
			dataType: 'json',
			async: true,
			cache: false,
			success: function (result) {
				if (result.msg == 'SUCCESS') {
					$preview_bar.find('._temp').hide();
					$preview_bar.find('._published').show();
				}else{
					alert(result.msg );
				}
			},
			error: function(){
				alert(getLocalizeString('설명_게시하기실패', '', '게시하기에 실패 했습니다. 새로고침 하시거나 잠시 후 재시도해주시고 계속 실패한다면 고객센터에 문의해주세요.'));
			}
		});
	};

	var checkPublishAlert = function(){
		$.ajax({
			'type' : 'POST',
			'data' : {},
			'url' : ('/admin/ajax/check_publish_alert.cm'),
			'dataType' : 'json',
			'async' : false,
			'cache' : false,
			'success' : function(result){
				if(result.msg === 'PASS') {
					publishDesignTemp();
				}else{
					if(confirm(result.msg)){
						publishDesignTemp();
					}
				}
			}
		});
	};

	var closePreviewMode = function(back_url){
		window.location.href='/backpg/close_preview_mode.cm?back_url='+back_url;
	};
	return {
		'init' : function(){
			init();
		},
		'checkPublishAlert' : function(){
			checkPublishAlert();
		},
		'publishDesignTemp' : function(){
			publishDesignTemp();
		},
		'closePreviewMode' : function(back_url){
			closePreviewMode(back_url);
		}
	}
}();