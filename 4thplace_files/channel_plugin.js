/*---------------------------------------------------
#	Channel Plugin
---------------------------------------------------*/
var CHANNEL_PLUGIN = function(){
	var user_profile = {};
	var init = function(pluginSetting, test){
		loadScript(test);
		var updateProfile = pluginSetting['updateUserProfile'];
		delete pluginSetting['updateUserProfile'];

		// 채널 부팅
		window.ChannelIO("boot", pluginSetting, function (error, user) {
			if (error) {
				//console.error(error);
			} else {
				if ( typeof user.profile !== "undefined" ) {
					Object.assign(user_profile, user.profile);
				}
				if ( updateProfile ) { updateUserProfile(); }
			}
		});

	};

	var loadScript = function(test){
		test = typeof test ==  'undefined' ? false : test;
		var w = window;
		if (w.ChannelIO) {
			return (window.console.error || window.console.log || function(){})('ChannelIO script included twice.');
		}
		var d = window.document;
		var ch = function() {
			ch.c(arguments);
		};
		ch.q = [];
		ch.c = function(args) {
			ch.q.push(args);
		};
		w.ChannelIO = ch;
		function l() {
			if (w.ChannelIOInitialized) {
				return;
			}
			w.ChannelIOInitialized = true;
			var s = document.createElement('script');
			s.type = 'text/javascript';
			s.async = true;
			s.src = test ?'https://cdn.channel.io/plugin/ch-plugin-web-exp.js':'https://cdn.channel.io/plugin/ch-plugin-web.js';
			s.charset = 'UTF-8';
			var x = document.getElementsByTagName('script')[0];
			x.parentNode.insertBefore(s, x);
		}
		if (document.readyState === 'complete') {
			l();
		} else if (window.attachEvent) {
			window.attachEvent('onload', l);
		} else {
			window.addEventListener('DOMContentLoaded', l, false);
			window.addEventListener('load', l, false);
		}
	};

	var updateUserProfile = function(type){
		if ( typeof window.ChannelIO === "undefined" ) { return false; }

		$.ajax({
			"type": "GET",
			"url": "/ajax/get_user_profile.cm",
			"data": {"type": type, '__': MEMBER_HASH},
			"dataType": "json",
			"success": function(res) {
				//console.log(res);
				if ( res["msg"] == "SUCCESS" ) {
					updateChannelProfile(res["profile"]);
				}
			}
		});
	};

	var updateChannelProfile = function(update_data){
		if ( typeof window.ChannelIO === "undefined" ) { return false; }
		if ( Object.keys(update_data).length <= 0 ) return false;

		ChannelIO("updateUser", {"profile": update_data}, function (error, user) {
			if (error) {
				console.error(error);
			} else {
				console.log('updateUser success', user);
				Object.assign(user_profile, user.profile);
			}
		});
	};

	var addCountUserProfileAttr = function(key, count) {
		if ( typeof user_profile[key] == "undefined" ) return;
		if ( typeof count == "undefined") count = 1;

		var update_profile = {};
		user_profile[key] = parseInt(user_profile[key]);
		if ( isNaN(user_profile[key]) ) user_profile[key] = 0;

		update_profile[key] = user_profile[key] + (count);
		if ( update_profile[key] <= 0 ) update_profile[key] = 0;
		updateChannelProfile(update_profile);
	};

	var checkUserProfile = function(){
		console.log(user_profile);
	};


	//// 마케팅 관련 기능 ////


	/*---------------------------------------------------
	#	Channel 넛지 기능
	#	https://developers.channel.io/docs/web-chplugin
	# 	채널측 수정으로 인해 위 링크 동작하지 않음....... (개발 가이드페이지 있는지 확인 후에 제공해주신다고함)
	#	-------------------------------------------------
	# 	채널 마케팅 설정 가이드
	#	https://www.notion.so/bdd5395257204bbfa80dc43be21ff5c7
	# 	channel_trace.js 에서 옮김..
	---------------------------------------------------*/

	// 회원가입 완료시
	var CompleteJoin = function(){
		addMarketingTrace("SignUp");
	};

	// 입력폼 응답시
	var CompleteSubmit = function(){
		addMarketingTrace("SurveySubmit");
	};

	// 상품 상세페이지
	var ViewContent = function(id){
		addMarketingTrace("ProductView", {"id": id});
	};

	// 장바구니에 추가
	var AddToCart = function(id, count, price, currency){
		addMarketingTrace("AddToCart", {"id": id, "currency": currency, "itemCount": count, "itemPrice": price});


		// 채널 유저 데이터 업데이트 (스크립트로 해야할지..고민됨)
		user_profile["cartCount"] 	= (typeof user_profile["cartCount"] == "undefined") ? 0 : parseInt(user_profile["cartCount"]);
		user_profile["cartAmount"] 	= (typeof user_profile["cartAmount"] == "undefined") ? 0 : parseInt(user_profile["cartAmount"]);

		var updatedProfile = {};
		updatedProfile["cartCount"] 	= user_profile["cartCount"] + count;
		updatedProfile["cartAmount"] 	= user_profile["cartAmount"] + (count * price);
		updateChannelProfile(updatedProfile);

	};

	var AddToWishlist = function(){
		addMarketingTrace("AddToWish");
		addCountUserProfileAttr("wishCount");
	};


	//// 마케팅 - 새로운 주문 관련 기능 ////


	var order = {};
	// 주문서 작성 페이지 진입
	var AddOrder = function(order_code){
		if( typeof order_code != "undefined"){
			addMarketingTrace("CheckoutBegin", {"order_no": order_code});
		} else {
			addMarketingTrace("CheckoutBegin");
		}
	};

	// 주문정보 추가
	var AddOrderInfo        = function(name,qty,price){
		if ( typeof order["products"] == "undefined" ) { order = {"totalQuantity": 0, "products": []}; }
		order["products"].push({"name": name, "quantity": qty, "price": price});
		order["totalQuantity"]++;
	};

	// 주문 완료 (결제완료)
	var CompletePayment = function(price,currency){
		order["totalPrice"]       = price;
		order["currency"]          = currency;
		addMarketingTrace("CheckoutComplete", order);

		order = {};
	};

	// 리뷰 작성 완료
	var CompleteReview= function(){
		addMarketingTrace("ReviewSubmit");
		addCountUserProfileAttr("reviewCount");
	};


	var addMarketingTrace = function(type, obj){
		if ( typeof window.ChannelIO === "undefined" ) { return false; }
		if(obj != undefined){
			window.ChannelIO("track", type, obj);
		}else{
			window.ChannelIO("track", type);
		}
	};

	return {
		"init": function(pluginSetting, test){
			init(pluginSetting, test);
		},
		"updateChannelProfileAttr": function(type){
			updateUserProfile(type);
		},
		"updateChannelProfile": function(profile){
			updateChannelProfile(profile);
		},
		"addCountUserProfileAttr": function(key, count){
			addCountUserProfileAttr(key, count);
		},
		"checkUserProfile": function(){
			checkUserProfile();
		},
		"CompleteJoin": function(){
			CompleteJoin();
		},
		"CompleteSubmit": function(){
			CompleteSubmit();
		},
		"ViewContent": function(id){
			ViewContent(id);
		},
		"AddToCart": function(id, count, price, currency){
			AddToCart(id, count, price, currency);
		},
		"AddToWishlist": function(){
			AddToWishlist();
		},
		"AddOrder": function(order_code){
			AddOrder(order_code);
		},
		"AddOrderInfo": function(name,qty,price){
			AddOrderInfo(name,qty,price);
		},
		"CompleteReview": function(){
			CompleteReview();
		},
		"CompletePayment": function(price,currency){
			CompletePayment(price,currency);
		}

	};
}();

