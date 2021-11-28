var SITE_SHOP_MYPAGE = function(){
	var $order_list;
	var $order_list_empty;
	var $order_list_more_button;
	var currentPage = 1;
	var getOrderListProgress = false;

	var $regularly_list_body;
	var $regularly_order_tab;
	var $regularly_cancel_tab;

	var $point_list;
	var $point_list_table;
	var $point_list_empty;
	var $point_list_more_button;
	var get_point_list_progress = false;

	var $order_cancel_form;
	var $order_return_form;
	var $order_exchange_form;
	var cancel_order_code = '';	/* 취소처리중인 주문코드 */
	var auto_cancel_enable = 'N';	/* 자동취소 지원 Y/N */
	var return_order_code = '';	/* 반품 진행중인 주문코드 */
	var exchange_order_code = '';	/* 교환 진행중인 주문코드 */

	var is_canceling = false; // 취소 신청 처리중 여부
	var add_member_billing_check = false; //간편결제 등록 처리중 여부
	var $changeRegularlyItemLayer;

	var initOrderList = function(){
		$order_list = $('#shop_mypage_orderlist');
		$order_list_empty = $('#shop_mypage_orderlist_empty');
		$order_list_more_button = $('#shop_mypage_orderlist_more');
	};
	var initPointList = function(){
		$point_list = $('#shop_mypage_pointlist');
		$point_list_table = $('#shop_mypage_pointlist_table');
		$point_list_empty = $('#shop_mypage_pointlist_empty');
		$point_list_more_button = $('#shop_mypage_pointlist_more');
	};
	/**
	 * 위시리스트 제거
	 * @param prod_code
	 */
	var deleteProdWish = function(prod_code){
		$.ajax({
			type : 'POST',
			data : {'type' : 'delete', 'prod_code' : prod_code},
			url : ('/shop/add_prod_wish.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					if ( typeof CHANNEL_PLUGIN != "undefined" ) CHANNEL_PLUGIN.addCountUserProfileAttr('wishCount', -1);
					window.location.reload();
				}else
					alert(res.msg);
			}
		});
	};

	var deleteBookingProdWish = function(prod_code){
		$.ajax({
			type : 'POST',
			data : {'type' : 'delete', 'prod_code' : prod_code},
			url : ('/booking/add_prod_wish.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					if ( typeof CHANNEL_PLUGIN != "undefined" ) CHANNEL_PLUGIN.addCountUserProfileAttr('wishCount', -1);
					window.location.reload();
				}else
					alert(res.msg);
			}
		});
	};

	var initRegularlyList = function(){
		$regularly_list_body = $('#regularly_list_body');
		$regularly_order_tab = $('#regularly_order_tab');
		$regularly_cancel_tab = $('#regularly_cancel_tab');
		getRegularlyOrderList(1);
	};

	var getRegularlyOrderList = function(page){
		$.ajax({
			type : 'POST',
			data : {'page' : page},
			url : ('/shop/mypage_regularly_order_list.cm'),
			dataType : 'json',
			cache : false,
			success : function(result){
				if(result.msg === 'SUCCESS'){
					$regularly_list_body.html(result.html);
					$regularly_cancel_tab.removeClass('active');
					$regularly_order_tab.addClass('active');
				}else{
					alert(result.msg);
				}
			},
			error: function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	}

	var getRegularlyCancelList = function(page){
		$.ajax({
			type : 'POST',
			data : {'page' : page},
			url : ('/shop/mypage_regularly_cancel_list.cm'),
			dataType : 'json',
			cache : false,
			success : function(result){
				if(result.msg === 'SUCCESS'){
					$regularly_list_body.html(result.html);
					$regularly_order_tab.removeClass('active');
					$regularly_cancel_tab.addClass('active');
				}else{
					alert(result.msg);
				}
			},
			error: function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	}

	var registerRegularlyCard = function(is_update){
		$.ajax({
			type : 'POST',
			url : ('/shop/register_payment_method.cm'),
			dataType : 'json',
			cache : false,
			success : function(result){
				if(result.msg == 'SUCCESS'){
					$.cocoaDialog.open({type : 'register_payment_method', custom_popup : result.html, pc_width: 400}, function(){
						if(add_member_billing_check) return;
						var $register_payment_method_form = $("#register_payment_method_form");
						var $num_input = $register_payment_method_form.find('input[type=text], input[type=password]');
						var $agree_all_check = $('#payment_method_agree_all_check');
						var $agree = $register_payment_method_form.find('._agree');
						var $open_popup_privacy = $register_payment_method_form.find('._open_popup_privacy');
						$num_input.check_num();

						for(var i = 0; i < ($num_input.length - 1); i++){
							(function(cnt){
								$($num_input[cnt]).on('keyup', function(){
									var $that = $(this);
									if($that.val().length == $that.attr('maxlength')){
										$($num_input[cnt + 1]).focus();
									}
								});
							})(i);
						}
						$agree_all_check.off('change').on('change', function(val){
							$agree.prop('checked', $agree_all_check.prop('checked'));
						});
						$agree.off('change').on('change', function(){
							var agree_cnt = 0;
							$.each($agree, function(){
								if($(this).prop('checked')) agree_cnt++;
							})
							$agree_all_check.prop('checked', $agree.length === agree_cnt);
						});
						$open_popup_privacy.off('click').on('click', function(){
							openPopupPrivacy($(this).attr('data-type'));
						})

						$register_payment_method_form.find("._register").click(function(){
							var data = $register_payment_method_form.serializeObject();

							var all_check = true;
							$.each(data,function(k,v){
								if(!all_check) return false;
								if($.isArray(v)){
									$.each(v,function(index,v2){
										if(v2 === ""){
											all_check = false;
											return false;
										}
									});
								}else{
									if(v === ""){
										all_check = false;
										return false;
									}
								}
							});

							if(!all_check){
								alert('등록정보를 모두 입력해주세요');
								return false;
							}


							var agree_count = $register_payment_method_form.find("._checkbox_group ._agree:checked").length;
							if(agree_count !== 4){
								alert('이용약관을 동의해주세요');
								return false;
							}

							data.agree = 'Y';
							data.is_update = is_update;
							add_member_billing_check = true;
							$.ajax({
								type : 'POST',
								data : data,
								url : ('/shop/add_easy_payment_card.cm'),
								dataType : 'json',
								cache : false,
								success : function(result){
									if(result.msg == 'SUCCESS'){
										$("#card_info_wrap_before").addClass('hide');
										var $card_info_wrap_after = $("#card_info_wrap_after");
										$card_info_wrap_after.removeClass('hide');
										$card_info_wrap_after.find('._card_name').html(result.card_name);
										$card_info_wrap_after.find('._card_no').html(result.card_no);
										$("#card_info_wrap_after_tool").removeClass('hide');
										$.cocoaDialog.close();
									}else{
										alert(result.msg);
									}
									add_member_billing_check = false;
								},
								error : function(){
									alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
								}
							});
						});
					});
				}else{
					alert(result.msg);
				}
			},
			error : function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	}

	var openPopupPrivacy = function(agree_type) {
		var $popup_html;
		switch(agree_type){
			case 'regularly_policy_agree' : $popup_html = IMWEB_TEMPLATE.loadSimple('REGULARLY_POLICY_TEMPLATE');
				break;
			case 'regularly_privacy_agree' : $popup_html = IMWEB_TEMPLATE.loadSimple('REGULARLY_PRIVACY_TEMPLATE');
				break;
			case 'regularly_third_agree' :  $popup_html = IMWEB_TEMPLATE.loadSimple('REGULARLY_THIRD_TEMPLATE');
				break;
			case 'regularly_payment_agree' :  $popup_html = IMWEB_TEMPLATE.loadSimple('REGULARLY_PAYMENT_TEMPLATE');
				break;
			default : $popup_html = IMWEB_TEMPLATE.loadSimple('PRIVACY_TEMPLATE');
				break;
		}
		$.cocoaDialog.open({type : 'site_payment_privacy', custom_popup : $popup_html});
	}

	var deleteRegularlyCard = function(use_regularly_order){
		use_regularly_order = 'N';
		if(use_regularly_order === 'Y'){
			$.cocoaDialog.open({
				type: 'alert_responsive',
				content: getLocalizeString("설명_진행중인정기구독주문이있어카드삭제불가", "", "현재 진행 중인 정기구독 주문이 있어 카드를 삭제할 수 없습니다.<br/>카드 변경 혹은 정기구독 해지 후 카드를 삭제해 주세요."),
				confirm_text: getLocalizeString('버튼_확인', '', '확인')
			});
		}else{
			$.cocoaDialog.open({
				type: 'alert_responsive',
				content: getLocalizeString("설명_등록된자동결제카드를삭제하시겠습니까", "", "등록된 자동결제 카드를 <br class='hidden-lg hidden-md hidden-sm'/>삭제하시겠습니까?"),
				confirm_text: getLocalizeString('버튼_확인', '', '확인'),
				cancel_text: getLocalizeString('버튼_취소', '', '취소')
			}, function(){
				$.ajax({
					type : 'POST',
					url : ('/shop/delete_easy_payment_card.cm'),
					dataType : 'json',
					cache : false,
					success : function(result){
						if(result.msg == 'SUCCESS'){
							$("#card_info_wrap_before").removeClass('hide');
							$("#card_info_wrap_after").addClass('hide');
							$("#card_info_wrap_after_tool").addClass('hide');
							$.cocoaDialog.close();
						}else{
							alert(result.msg);
						}
					},
					error : function(){
						alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
					}
				});
			});
		}
	}

	var changeRegularlyCard = function(){
		registerRegularlyCard('Y');
	}

	var unsetRegularlyAllProd = function(idx){
		$.cocoaDialog.open({
			type: 'alert_responsive',
			content: getLocalizeString("설명_전체상품의정기구독을해지하시겠습니까", "", "전체 상품의 정기구독을 <br class='hidden-lg hidden-md hidden-sm'/>해지하시겠습니까?"),
			confirm_text: getLocalizeString('버튼_확인', '', '확인'),
			cancel_text: getLocalizeString('버튼_취소', '', '취소')
		}, function(){
			unsetRegularlyProd('all',idx);
		});
	};

	var unsetRegularlyProdItem = function(idx, item_code,prod_check_code,item_code_list){
		var msg = getLocalizeString("설명_해당상품의정기구독을해지하시겠습니까", "", "해당 상품의 정기구독을 <br class='hidden-lg hidden-md hidden-sm'/>해지하시겠습니까?");
		if(prod_check_code != ''){
			msg = getLocalizeString("설명_해당상품의정기구독을해지하시겠습니까선택옵션도함께", "", "해당 상품의 정기구독을 <br class='hidden-lg hidden-md hidden-sm'/>해지하시겠습니까?<br>선택옵션도 함께 해지됩니다.");
		}
		$.cocoaDialog.open({
			type: 'alert_responsive',
			content: msg,
			confirm_text: getLocalizeString('버튼_확인', '', '확인'),
			cancel_text: getLocalizeString('버튼_취소', '', '취소')
		}, function(){
			unsetRegularlyProd('item',idx, item_code,prod_check_code,item_code_list);
		});
	};

	var unsetRegularlyProd = function(type,idx, item_code,prod_check_code,item_code_list){
		$.ajax({
			type : 'POST',
			data : {'type' : type, 'idx' : idx, 'item_code' : item_code, 'prod_check_code' : prod_check_code, 'item_code_list' : item_code_list},
			url : ('/shop/update_regularly_status.cm'),
			dataType : 'json',
			cache : false,
			success : function(res){
				if(res.msg == 'SUCCESS'){
					var location_url = '/shop_mypage/?m2=regularly';
					window.location.href = location_url;
				}else{
					alert(res.msg);
				}
			},
			error : function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	};

	/**
	 * 이전 구독일정 모달
	 * @param regularly_code
	 * @param is_multiple_prod
	 */
	var showRegularlyDateList = function(regularly_code,is_multiple_prod){
		$.ajax({
			type : 'POST',
			data : {'is_multiple_prod' : is_multiple_prod},
			url : ('/shop/open_regularly_date.cm'),
			dataType : 'json',
			success : function(result){
				if(result.msg == 'SUCCESS'){
					$.cocoaDialog.open({type : 'regularly_date_list', custom_popup : result.html}, function(){
						getRegularlyDateList(regularly_code, 1,is_multiple_prod);
					});
				}else{
				}
			},
			error : function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	};

	var getRegularlyDateList = function(regularly_code, page,is_multiple_prod){
		var $regularly_date_body = $('#regularly_date_body');
		var $regularly_date_paging = $('#regularly_date_paging');
		if($regularly_date_body.length > 0){
			$.ajax({
				type : 'GET',
				data : {'regularly_code' : regularly_code, 'page' : page,'is_multiple_prod': is_multiple_prod},
				url : ('/shop/regularly_date_list.cm'),
				dataType : 'json',
				cache : true,
				success : function(result){
					if(result.msg == 'SUCCESS'){
						$regularly_date_body.html(result.html);
						if(result.paging_html != '' ){
							$regularly_date_paging.html(result.paging_html);
						}
					}else{
						alert(result.msg);
					}
				},
				error : function(){
					alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
				}
			});
		}
	};

	var showRegularlySelectPeriod = function(idx){
		$.ajax({
			type : 'POST',
			data : {'idx': idx},
			url : ('/shop/regularly_select_period.cm'),
			dataType : 'json',
			cache : false,
			success : function(result){
				if(result.msg  == 'SUCCESS'){
					$.cocoaDialog.open({type : 'regularly_select_period', custom_popup : result.html}, function(){
						$('#regularly_select_period_confirm').on('click', function(){
							var cycle_type = $("#cycle_type").val();
							var cycle_value = $("#cycle_value").val();
							changeRegularlyPeriod(idx, cycle_type, cycle_value);
						})
					});
				}else{
					alert(result.msg);
				}
			},
			error : function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	};

	var changeRegularlyPeriod = function(idx){
		var cycle_type = $("#cycle_type").val();
		var cycle_value = $("#cycle_value").val();
		$.ajax({
			type : 'POST',
			data : {'idx' : idx, 'cycle_type' : cycle_type,'cycle_value' : cycle_value},
			url : ('/shop/update_regularly_cycle.cm'),
			dataType : 'json',
			cache : false,
			success : function(res){
				if(res.msg == 'SUCCESS'){
					var location_url = '/shop_mypage/?m2=regularly&idx='+idx;
					window.location.href = location_url;
				}else{
					alert(res.msg);
				}
			},
			error : function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	};

	var skipRegularlyProdAll = function(idx,date_text){
		$.cocoaDialog.open({
			type: 'alert_responsive',
			content: getLocalizeString("설명_이번배송을건너뛰겠습니까다음구독일은n입니다", date_text, "이번 배송을 건너뛰겠습니까?<br/>해당 상품의 다음 구독일은 <strong>%1</strong> 입니다."),
			confirm_text: getLocalizeString('버튼_확인', '', '확인'),
			cancel_text: getLocalizeString('버튼_취소', '', '취소')
		}, function(){
			skipRegularlyProd('all',idx);
		});
	};

	var skipRegularlyProdItem = function(idx,item_code,date_text,prod_check_code,item_code_list){
		var msg = getLocalizeString("설명_이번배송을건너뛰겠습니까다음구독일은n입니다", date_text, "이번 배송을 건너뛰겠습니까?<br/>해당 상품의 다음 구독일은 <strong>%1</strong> 입니다.");
		if(prod_check_code != ''){
			msg = getLocalizeString("설명_이번배송을건너뛰겠습니까다음구독일은n입니다선택옵션도함께", date_text, "이번 배송을 건너뛰겠습니까?<br/>해당 상품의 다음 구독일은 <strong>%1</strong> 입니다.<br>선택옵션도 함께 적용됩니다.");
		}
		$.cocoaDialog.open({
			type: 'alert_responsive',
			content: msg,
			confirm_text: getLocalizeString('버튼_확인', '', '확인'),
			cancel_text: getLocalizeString('버튼_취소', '', '취소')
		}, function(){
			skipRegularlyProd('item',idx,item_code,prod_check_code,item_code_list);
		});
	};

	var skipRegularlyProd = function(type,idx, item_code,prod_check_code,item_code_list){
		$.ajax({
			type : 'POST',
			data : {'type' : type, 'idx' : idx, 'item_code' : item_code, 'prod_check_code' : prod_check_code, 'item_code_list' : item_code_list},
			url : ('/shop/update_regularly_skip.cm'),
			dataType : 'json',
			cache : false,
			success : function(res){
				if(res.msg == 'SUCCESS'){
					var location_url = '/shop_mypage/?m2=regularly&idx='+idx;
					window.location.href = location_url;
				}else{
					alert(res.msg);
				}
			},
			error : function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	};

	var showRegularlyChangeDetail = function(idx,count,regularly_code,item_code){
		$.ajax({
			type : 'POST',
			data : {'count' : count},
			url : ('/shop/regularly_change_count.cm'),
			dataType : 'json',
			cache : false,
			success : function(result){
				if(result.msg == 'SUCCESS'){
					$.cocoaDialog.open({type : 'regularly_change_detail', custom_popup : result.html, pc_width: 400}, function(){
						var $modal_regularly_change_detail = $('.modal_regularly_change_detail');
						var $regularly_count = $modal_regularly_change_detail.find('input[name=count]');
						$('#regularly_count_minus').on('click', function(){
							if(parseInt($regularly_count.val()) > 1) $regularly_count.val(parseInt($regularly_count.val()) - 1);
						});
						$('#regularly_count_plus').on('click', function(){
							$regularly_count.val(parseInt($regularly_count.val()) + 1);
						});
						$regularly_count.change(function(){
							if(parseInt($regularly_count.val())  < 1) $regularly_count.val(1);
						});

						$('#regularly_change_count_confirm').on('click', function(){
							RegularlyChangeDetail(idx,regularly_code,item_code,$regularly_count.val());
						})
					});
				}else{
					alert(result.msg);
				}
			},
			error : function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	};

	var RegularlyChangeDetail = function(idx,regularly_code,item_code,change_count){
		$.ajax({
			type : 'POST',
			data : {'regularly_code' : regularly_code , 'item_code' : item_code, 'change_count' : change_count},
			url : ('/shop/update_regularly_count.cm'),
			dataType : 'json',
			cache : false,
			success : function(result){
				if(result.msg == 'SUCCESS'){
					var location_url = '/shop_mypage/?m2=regularly&idx='+idx;
					window.location.href = location_url;
				}else{
					alert(result.msg);
				}
			},
			error : function(){
				alert(getLocalizeString('설명_잠시후다시시도해주세요', '', '잠시 후 다시 시도해주세요.'));
			}
		});
	};

	var getOrderList = function(type){
		if(getOrderListProgress) return;
		getOrderListProgress = true;
		$.ajax({
			type : 'POST',
			data : {'page' : currentPage, 'type':type},
			url : ('/shop/mypage_order_list.cm'),
			dataType : 'json',
			cache : false,
			success : function(result){
				getOrderListProgress = false;
				if(result.msg == 'SUCCESS'){
					if(result.count > 0){
						$order_list_empty.hide();
						$order_list.show();

						if ( currentPage == 1 ) {
							$order_list.html(result.html);
						} else {
							$order_list.append(result.html);
						}
					}else{
						$order_list.hide();
						if(type === 'cancel'){
							$order_list_empty.text(getLocalizeString('설명_취소내역이없습니다', '', '취소 내역이 없습니다.'));
						}else{
							$order_list_empty.text(getLocalizeString('설명_주문내역이없습니다', '', '주문 내역이 없습니다.'));
						}
						$order_list_empty.show();
					}

					currentPage++;
					if( parseInt(currentPage) > parseInt(result.pageCount) )
						$order_list_more_button.hide();
					else
						$order_list_more_button.show();
				}else{
					alert(result.msg);
				}
			}
		});
	};

	var getPointList = function(){
		if(get_point_list_progress) return;
		get_point_list_progress = true;
		$.ajax({
			type : 'POST',
			data : {'page' : currentPage},
			url : ('/shop/mypage_point_list.cm'),
			dataType : 'json',
			cache : false,
			success : function(result){
				get_point_list_progress = false;
				if(result.msg == 'SUCCESS'){
					if(result.count > 0){
						$point_list_table.show();
						$point_list_empty.hide();
						$point_list.append(result.html);
					}else{
						$point_list_table.hide();
						$point_list_empty.show();
					}
					currentPage++;
					if(parseInt(currentPage) > parseInt(result.pageCount)) $point_list_more_button.hide();
				}else{
					alert(result.msg);
				}
			}
		});
	};

	var trackingParcel = function(code){
		if ( code == void 0 || code == '' ) {
			alert(LOCALIZE.설명_택배사또는송장번호가입력되지않았습니다());
			return;
		}

		$.ajax({
			type : 'POST',
			data : {'code':code},
			url : ('/ajax/get_parcel_info.cm'),
			dataType : 'json',
			success : function(res){
				if ( res.msg == 'SUCCESS' ) {
					$.cocoaDialog.open({type : 'admin', custom_popup : res.html, width : 550});
				} else {
					alert(res.msg);
				}
			}
		});
	};

	var trackingParcelEcpay = function(code){
		if ( isBlank(code) ) {
			return;
		}
		$.ajax({
			"type": "POST",
			"data": {"code": code},
			"url": "/shop/tracking_parcel_ecpay.cm",
			"dataType": "JSON",
			"success": function(res) {
				$.cocoaDialog.open({type : 'admin', custom_popup : res['html'], width : 550});
			}
		});
	};

	/**
	 * 취소요청 페이지 초기화
	 * @param auto_cancel 자동취소지원유무 (Y/N)
	 */
	var initCancelOrder = function(order_code, auto_cancel){
		$order_cancel_form = $('#order_cancel_form');
		auto_cancel_enable = auto_cancel;
		cancel_order_code = order_code;
		cancelOrderSelectProdOrder();
	};

	/* 취소요청 페이지 품목주문 전체 선택 */
	var cancelOrderSelectAllProdOrder = function(chk){
		$order_cancel_form.find("input._prodOrderCheck").prop("checked", chk);
		cancelOrderLoadRefundPriceData();
	};

	/* 취소요청 페이지 품목주문 선택 */
	var cancelOrderSelectProdOrder = function(){
		var refund_price = cancelOrderLoadRefundPriceData();
		if ( auto_cancel_enable == 'Y' || refund_price == 0 ) {	/* 전체 취소, 자동 취소 가능 */
			$('#refund_data_wrap').hide();
		}else{	/* 부분취소 */
			$('#refund_data_wrap').show();
		}
	};

	/* 취소요청 페이지에서 환불 금액 정보를 로드함 */
	var cancelOrderLoadRefundPriceData = function(){
		var refund_price = 0;
		var prod_order_code_list = [];
		$order_cancel_form.find("input._prodOrderCheck:checked").each(function(){
			prod_order_code_list.push($(this).val());
		});
		$.ajax({
			type : 'POST',
			data : {"prod_order_code_list": prod_order_code_list, "order_code": cancel_order_code},
			url : ('/shop/order_cancel_refund_price_data.cm'),
			dataType : 'json',
			async: false,
			success : function(res){
				if(res.msg == 'SUCCESS'){
					auto_cancel_enable = res.auto_cancel_enable === true ? 'Y' : 'N';
					$('#refund_price_data_wrap').html(res.result_html);
					refund_price = res['refund_price'];
				}
			}
		});
		return refund_price;
	};

	/* 반품요청 페이지에서 환불 금액 정보를 로드함 */
	var returnOrderLoadRefundPriceData = function(){
		var prod_order_code_list = [];
		$order_return_form.find("input._prodOrderCheck:checked").each(function(){
			prod_order_code_list.push($(this).val());
		});

		// 반품 배송비 계산 - 전체 반품일 경우 초기 배송비도 더해서 보여준다
		$order_return_form.find('#_include_deliv_price').hide();
		var deliv_return_price = $order_return_form.find('#_deliv_refund_price').data('return_price');
		if ( $order_return_form.find('input._prodOrderCheck').length == $order_return_form.find('input._prodOrderCheck:checked').length ) {
			var deliv_price = $order_return_form.find('#_deliv_refund_price').data('deliv_price');
			var island_price = $order_return_form.find('#_deliv_refund_price').data('island_price');
			if ( deliv_price == 0 ) {
				deliv_price = deliv_return_price;
			}
			deliv_return_price += deliv_price + island_price;
			$order_return_form.find('#_include_deliv_price').show();	// 초기 배송비 포함 출력 제어
		}
		$order_return_form.find('#_deliv_refund_price').text(LOCALIZE.getCurrencyFormat(deliv_return_price));

		var return_reason = $order_return_form.find("select[name='reason']").val();
		var deliv_fee_pay_method = $order_return_form.find("select[name='deliv_fee_pay_method']").val();
		$.ajax({
			type : 'POST',
			data : {"prod_order_code_list": prod_order_code_list, "order_code": return_order_code, "deliv_fee_pay_method":deliv_fee_pay_method, "return_reason":return_reason },
			url : ('/shop/order_return_refund_price_data.cm'),
			dataType : 'json',
			async: false,
			success : function(res){
				if(res.msg == 'SUCCESS'){
					auto_cancel_enable = res.auto_cancel_enable === true ? 'Y' : 'N';
					$('#refund_price_data_wrap').html(res.result_html);
				}
			}
		});

		return auto_cancel_enable;
	};

	/**
	 * 취소요청 페이지 취소버튼 누를떄 처리
  	 * @param type shop/booking
	 */
	var cancelOrder = function(type){
		if ( is_canceling ) return;

		$order_cancel_form = $('#order_cancel_form');
		if (type=='shop'){
			if(!confirm(LOCALIZE.타이틀_주문취소를진행하시겠습니까())) return;
		}else if (type=='booking'){
			if(!confirm(LOCALIZE.타이틀_예약취소를진행하시겠습니까())) return;
		}

		is_canceling = true;
		var data = $order_cancel_form.serializeObject();
		data.type=type;
		$.ajax({
			type : 'POST',
			data : data,
			url : ('/shop/order_cancel.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					alert(res.result_msg);
					if(res.ga_switch && res.ga_info.length >= 1){
						/* GA 전자상거래 회수 */
						if ( typeof GOOGLE_ANAUYTICS != "undefined") {
							GOOGLE_ANAUYTICS.Completepayment(res.ga_info[0]['id'],res.total_price);
							GOOGLE_ANAUYTICS.ReversePayment(res.ga_info);
						}
					}

					var location_url = '/shop_mypage/?m2=order';
					if ( res.is_guest_login == 'Y' ) { location_url += '&guest_login=Y'; }
					window.location.href = location_url;
				}else{
					alert(res.msg);
				}

				is_canceling = false;
			}
		});
	};

	/* 반품/교환 페이지 품목주문 전체 선택 */
	var returnOrderSelectAllProdOrder = function(chk){
		$order_return_form.find("input._prodOrderCheck").prop("checked", chk);
		returnOrderLoadRefundPriceData();
	};
	var exchangeOrderSelectAllProdOrder = function(chk){
		$order_exchange_form.find("input._prodOrderCheck").prop("checked", chk);
	};

	/* 반품/교환 페이지 품목주문 선택 */
	var returnOrderSelectProdOrder = function(){
		returnOrderLoadRefundPriceData();
		if(auto_cancel_enable == 'Y'){	/* 전체 취소, 자동 취소 가능 */
			$('#refund_data_wrap').hide();
		}else{	/* 부분취소 */
			$('#refund_data_wrap').show();
		}
	};
	var exchangeOrderSelectProdOrder = function(){
		if ($order_exchange_form.find("input._prodOrderCheck:not(:checked)").length==0 && auto_cancel_enable=='Y'){	/* 전체 취소, 자동 취소 가능 */
			$('#refund_data_wrap').hide();
		}else{	/* 부분취소 */
			$('#refund_data_wrap').show();
		}
	};

	/* 반품 수거 방법 변경 */
	var changeReturnCollectMethod = function(collect_method){
		$('._collect_method_wrap').hide();
		$('._collect_address_wrap').hide();

		switch ( collect_method ) {
			case 'RETURN_DESIGNATED':
				/* 지정 반품택배 */
				$('input[name="collect_method_type"][value="RETURN_DESIGNATED"]:radio').prop('checked', true);
				$('#collect_method_designated_wrap').show();
				$('._collect_address_wrap').show();
				break;
			case 'RETURN_DIRECT':
			case 'RETURN_PARCEL':
				$('input[name="collect_method_type"][value="RETURN_PARCEL"]:radio').prop('checked', true);
				/* 직접 발송 */
				$('#collect_method_direct_wrap').show();
				$('._collect_address_wrap').show();
				$('#collect_method').val(collect_method);
				if (collect_method == 'RETURN_PARCEL'){	//택배로 발송
					$('#collect_deliv_company').show();
					$('#collect_tracking_number').show();
					$('._form_select_wrap').show();
					$('#collect_msg').hide();
				}else{	/* 직접전달 */
					$('#collect_deliv_company').hide();
					$('#collect_tracking_number').hide();
					$('._form_select_wrap').hide();
					$('#collect_msg').show();
				}
				break;
			case 'RETURN_LGST_ORDER':
				$('input[name="collect_method_type"][value="RETURN_LGST_ORDER"]:radio').prop('checked', true);
				$('#collect_method_ecpay_api_wrap').show();
				$('#collect_method').val(collect_method);
				break;

		}
	};
	/* 반품 수거 방법 변경 (교환시) */
	var changeExchangeCollectMethod = function(collect_method){
		if (collect_method == 'RETURN_DESIGNATED'){	/* 지정 반품택배 */
			$("#collect_method_type_RETURN_DESIGNATED").prop('checked', true);
			$('#collect_method_direct_wrap').hide();
			$('#collect_method_designated_wrap').show();
		}else{	/* 직접 발송 */
			$("#collect_method_type_RETURN_PARCEL").prop('checked', true);
			$('#collect_method_direct_wrap').show();
			$('#collect_method_designated_wrap').hide();
			$('#collect_method').val(collect_method);
			if (collect_method == 'RETURN_PARCEL'){	//택배로 발송
				$('#collect_deliv_company').show();
				$('#collect_tracking_number').show();
				$('#collect_msg').hide();
			}else{	/* 직접전달 */
				$('#collect_deliv_company').hide();
				$('#collect_tracking_number').hide();
				$('#collect_msg').show();
			}
		}
	};

	/**
	 * 교환상세 다이얼로그 띄우기
	 */
	var showExchangeDetail = function(exchange_idx){
		$.ajax({
			type : 'POST',
			data : {'exchange_idx' : exchange_idx},
			url : ('/shop/order_exchange_detail.cm'),
			dataType : 'html',
			success : function(html){
				$.cocoaDialog.open({type : 'order_exchange_detail', custom_popup : html});
			}
		});
	};

	/**
	 * 반품상세 다이얼로그 띄우기
	 */
	var showReturnDetail = function(return_idx){
		$.ajax({
			type : 'POST',
			data : {'return_idx' : return_idx},
			url : ('/shop/order_return_detail.cm'),
			dataType : 'html',
			success : function(html){
				$.cocoaDialog.open({type : 'order_return_detail', custom_popup : html});
			}
		});
	};

	/**
	 *  취소상세 다이얼로그 띄우기
	 * @param cancel_idx
	 */
	var showCancelDetail = function(cancel_idx){
		$.ajax({
			type : 'POST',
			data : {'cancel_idx' : cancel_idx},
			url : ('/shop/order_cancel_detail.cm'),
			dataType : 'html',
			success : function(html){
				$.cocoaDialog.open({type : 'order_cancel_detail', custom_popup : html});
			}
		});
	};

	/**
	 * 반품요청 페이지 신청하기 누를떄 처리
	 */
	var returnOrder = function(){
		if(!confirm(getLocalizeString('타이틀_반품신청을진행하시겠습니까', '', '반품 신청을 진행하시겠습니까?'))) return;
		var data = $order_return_form.serializeObject();
		$.ajax({
			type : 'POST',
			data : data,
			url : ('/shop/order_return.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					if (res.result_msg!='') alert(res.result_msg);
					window.location.href='/shop_mypage/?m2=cancel';
				}else{
					alert(res.msg);
				}
			}
		});
	};

	/**
	 * 교환요청 페이지 신청하기 누를떄 처리
	 */
	var exchangeOrder = function(){
		if(!confirm(getLocalizeString('타이틀_교환신청을진행하시겠습니까', '', '교환 신청을 진행하시겠습니까?'))) return;
		var data = $order_exchange_form.serializeObject();
		$.ajax({
			type : 'POST',
			data : data,
			url : ('/shop/order_exchange.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					if (res.result_msg!='') alert(res.result_msg);
					if (res.deliv_fee>0){	/* 교환배송비가 있을경우 교환비용결제화면으로 이동 */
						window.location.href = '/shop_mypage/?m2=exchange_pay&idx=' + res.order_idx + '&exchange_idx=' + res.prod_order_idx;
					}else
						window.location.href='/shop_mypage/?m2=cancel';
				}else{
					alert(res.msg);
				}
			}
		});
	};

	/**
	 * 교환비용 결제 페이지 확인 누를떄 처리
	 */
	var exchangeOrderPay = function(){
		$order_exchange_form = $('#order_exchange_form');
		if(!confirm(getLocalizeString('타이틀_교환비용결제를진행하시겠습니까', '', '교환 비용결제를 진행하시겠습니까?'))) return;
		var data = $order_exchange_form.serializeObject();
		$.ajax({
			type : 'POST',
			data : data,
			url : ('/shop/order_exchange_pay.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					window.location.href='/shop_mypage/?m2=order';
				}else{
					alert(res.msg);
				}
			}
		});
	};

	/**
	 * 반품철회 누를떄 처리
	 */
	var withdrawReturnOrder = function(return_idx){
		if(!confirm(getLocalizeString('타이틀_반품신청을철회하시겠습니까', '', '반품신청을 철회하시겠습니까?'))) return;

		$.ajax({
			type : 'POST',
			data : {"return_idx":return_idx},
			url : ('/shop/order_return_withdraw.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					if (res.result_msg!='') alert(res.result_msg);
					window.location.href='/shop_mypage/?m2=order';
				}else{
					alert(res.msg);
				}
			}
		});
	};

	/**
	 * 교환철회 누를떄 처리
	 */
	var withdrawExchangeOrder = function(exchange_idx){
		if(!confirm(getLocalizeString('타이틀_교환신청을철회하시겠습니까', '', '교환신청을 철회하시겠습니까?'))) return;
		$.ajax({
			type : 'POST',
			data : {"exchange_idx":exchange_idx},
			url : ('/shop/order_exchange_withdraw.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					if (res.result_msg!='') alert(res.result_msg);
					window.location.href='/shop_mypage/?m2=order';
				}else{
					alert(res.msg);
				}
			}
		});
	};

	/**
	 * 취소철회 누를떄 처리
	 */
	var withdrawCancelOrder = function(cancel_idx){
		if(!confirm(getLocalizeString('타이틀_취소신청을철회하시겠습니까', '', '취소신청을 철회하시겠습니까?'))) return;
		$.ajax({
			type : 'POST',
			data : {"cancel_idx":cancel_idx},
			url : ('/shop/order_cancel_withdraw.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					if (res.result_msg!='') alert(res.result_msg);
					window.location.href='/shop_mypage/?m2=order';
				}else{
					alert(res.msg);
				}
			}
		});
	};

	var openMobileOrder = function(idx){
		$.ajax({
			type : 'POST',
			data : {'idx' : idx},
			url : ('/dialog/order_history.cm'),
			dataType : 'html',
			success : function(html){
				$.cocoaDialog.open({type : 'admin_order_history', custom_popup : html});
			}
		});
	};

	/**
	 * 반품 페이지 초기화
	 * @param auto_cancel 자동취소지원유무 (Y/N)
	 */
	var initReturnOrder = function(order_code, auto_cancel){
		$order_return_form = $('#order_return_form');
		auto_cancel_enable = auto_cancel;
		return_order_code = order_code;
		returnOrderSelectProdOrder();
		changeReturnCollectMethod($('input[name="collect_method_type"]:radio:checked').val());
	};

	/**
	 * 교환 페이지 초기화
	 */
	var initExchangeOrder = function(order_code,auto_cancel){
		$order_exchange_form = $('#order_exchange_form');
		auto_cancel_enable = auto_cancel;
		exchange_order_code = order_code;
		exchangeOrderSelectProdOrder();
	};

	var requestCashReceipt = function(q, mode){
		if(!q || !mode){
			alert(getLocalizeString('설명_주문번호혹은모드가없습니다', '', '주문번호 혹은 모드가 없습니다.'));
			return false;
		}
		$.ajax({
			type : 'POST',
			data : {'q' : q, 'mode' : mode},
			url : ('/shop/request_cash_receipt.cm'),
			dataType : 'json',
			success : function(res){
				if ( res.msg == 'SUCCESS' ) {
					$.cocoaDialog.open({type : 'request_cash_receipt', custom_popup : res.html})
				} else {
					alert(res.msg);
				}
			}
		});
	};

	var requestCashReceiptProc = function(q, cash_receipt_type, cash_receipt_value){
		$.ajax({
			type : 'POST',
			data : {'q' : q, 'cash_receipt_type' : cash_receipt_type, 'cash_receipt_value' : cash_receipt_value},
			url : ('/shop/request_cash_receipt_proc.cm'),
			dataType : 'json',
			success : function(res){
				if(res.msg == 'SUCCESS'){
					alert(getLocalizeString('설명_현금영수증신청이완료되었습니다', '', '현금영수증 신청이 완료되었습니다.'));
					window.location.reload();
				}else{
					alert(res.msg);
				}
			}
		});
	};

	var mod_order_no = '';
	var openChangeOrderAddress = function(q) {
		$.ajax({
			type : 'POST',
			data : {'q' : q},
			url : ('/shop/change_order_address.cm'),
			dataType : 'html',
			success : function(html){
				$.cocoaDialog.open({type : 'change_order_address', custom_popup : html})
				var $form = $('#modify_address_form');
				mod_order_no = $form.find("input[name='order_no']").val();
				$form.find('._add_btn').on('click', function() {
					$.ajax({
						type: 'POST',
						data: $form.serialize(),
						url: ('/shop/change_order_address_proc.cm'),
						dataType: 'json',
						async: false,
						cache: false,
						success: function (res2) {
							if (res2.msg == 'SUCCESS') {
								$.cocoaDialog.close();
								mod_order_no = '';
								location.reload();
							} else {
								var msg = res2.msg;
								if ( res2.code ) { msg += ' (' + res2.code + ')'; }
								alert(msg);
							}
						}
					});
				});
			}
		});
	};

	var changeDelivAddressCountrySelect = function(q) {
		var $form = $('#modify_address_form');

		$.ajax({
			type : 'POST',
			data : {'q': q},
			url : ('/shop/change_order_address_form.cm'),
			dataType : 'json',
			async : false,
			cache : false,
			success : function(res){
				if(res.msg == 'SUCCESS'){
					var $_address_wrap = $form.find('._deliv_address_wrap').find('._address_wrap');
					$_address_wrap.html(res.html);

					if ( res.use_daum_api == 'Y' ) {
						var addr_daum = new ZIPCODE_DAUM();
						addr_daum.init({
							'addr_container' : $('#order_find_address'),
							'addr_pop' : $('#address_search_popup .search_popup_body'),
							'post_code' : $('#order_postcode_input'),
							'addr' : $('#order_address_input'),
							'onStart' : function(){
							},
							'onComplete' : function(key){
								$('#order_address_detail_input').focus();
								address = key.jibunAddressEnglish;
								splitAddress= address.split(',');

								if(key.addressEnglish != "undefined"){
									address = key.addressEnglish;
									splitAddress= address.split(',');
									if(splitAddress.length > 5){
										street = splitAddress[0] + " " + splitAddress[1];
										city = splitAddress[2] + " " + splitAddress[3];
										state = splitAddress[4];
									} else {
										street = splitAddress[0] + " " + splitAddress[1];
										city = splitAddress[2];
										state = splitAddress[3];
									}
								} else if(key.jibunAddressEnglish != "undefined"){
									address = key.jibunAddressEnglish;
									splitAddress= address.split(',');
									if(splitAddress.length > 5){
										street = splitAddress[0] + " " + splitAddress[1];
										city = splitAddress[2] + " " + splitAddress[3];
										state = splitAddress[4];
									} else {
										street = splitAddress[0] + " " + splitAddress[1];
										city = splitAddress[2];
										state = splitAddress[3];
									}
								}

								$("input[name='address_street']").val(street);
								$("input[name='address_city']").val(city);
								$("input[name='address_state']").val(state);
								$("input[name='address_zipcode']").val(key.zonecode);
							},
							'onShow' : function() {
								$('#address_search_popup').show();
							},
							'onClose' : function(){
								$('#address_search_popup').hide();
							}
						});
					}
				}
			}
		});
	};

	var openChangeCVSAddress = function(cvs, order_no) {
		var popname = 'change_emap';

		var popup_w = 400;
		var popup_h = 600;
		var popup_top = Math.ceil((window.screen.height - popup_h) / 2 );
		var popup_left = Math.ceil((window.screen.width - popup_w) / 2 );

		var popup_style = '';
		popup_style += 'top=' + popup_top + ',';
		popup_style += 'left=' + popup_left + ',';
		popup_style += 'height=' + popup_h + 'px,';
		popup_style += 'width=' + popup_w + 'px';

		var url = '/ajax/change_cvs_address_popup.cm?cvs='+cvs+'&order_no='+order_no;
		window.open(url, popname, 'toolbar=no, channelmode=no, location=no, directories=no, menubar=no, scrollbars=yes, resizable=yes, status=yes, '+popup_style);
	};

	var updateCVSAddress = function(address_data){
		if ( mod_order_no === '' )	return;
		if ( typeof address_data == "undefined") return;
		if ( mod_order_no != address_data['mod_order_no'] ) return;

		var $form = $('#modify_address_form');
		$form.find('._deliv_address_wrap').find('.cvs_address_info').html(address_data['address_str']).addClass('text-danger');

		for ( var _key in address_data ) {
			if ( $form.find('input[name="'+_key+'"]').length > 0 ) {
				$form.find('input[name="'+_key+'"]').val(address_data[_key]);
			}
		}
		$form.find('.cvs_list_wrapper').hide();
	};

	var digitalFileDownload = function(prod_no, order_idx, is_expired) {
		if( is_expired ) {
			alert(getLocalizeString('설명_다운로드만료안내','',"다운로드 가능 기간 또는 횟수가 초과되었습니다. \n재 구매 후 다시 시도 바랍니다."));
			return false;
		}
		if ( !prod_no ) {
			alert(getLocalizeString('설명_다운로드불가안내','',"다운로드 가능한 파일이 없습니다. \n관리자에게 문의해 주세요."));
			return false;
		}
		$.ajax({
			"type" : "POST",
			"data" : {"prod_no" : prod_no, "order_idx": order_idx, "mode" : "mypage"},
			"url" : "/ajax/shop_digital_prod_download.cm",
			"dataType" : "JSON",
			"success" : function(res){
				if(res['msg'] == 'SUCCESS'){
					if(res['download_info_msg'].trim() == '' || confirm(res['download_info_msg'])){
						location.href = res['file_url'];
					}
				} else {
					alert(res['msg']);
				}
			}
		});
	};


	var digitalFileDownloadByProdOrder = function(prod_no, prod_order_no, is_expired) {
		if( is_expired ) {
			alert(getLocalizeString('설명_다운로드만료안내','',"다운로드 가능 기간 또는 횟수가 초과되었습니다. \n재 구매 후 다시 시도 바랍니다."));
			return false;
		}
		if ( !prod_no || !prod_order_no ) {
			alert(getLocalizeString('설명_다운로드불가안내','',"다운로드 가능한 파일이 없습니다. \n관리자에게 문의해 주세요."));
			return false;
		}

		$.ajax({
			"type" : "POST",
			"data" : {"mode" : "mypage", "prod_no" : prod_no, "prod_order_no" : prod_order_no},
			"url" : "/ajax/shop_digital_prod_download.cm",
			"dataType" : "JSON",
			"success" : function(res){
				if(res['msg'] == 'SUCCESS'){
					if(res['download_info_msg'].trim() == '' || confirm(res['download_info_msg'])){
						location.href = res['file_url'];
					}
				} else {
					alert(res['msg']);
				}
			}
		});
	};

	return {
		initPointList : function(){
			initPointList();
		},
		initOrderList : function(){
			initOrderList();
		},
		getOrderList : function(type){
			getOrderList(type);
		},
		getPointList : function(){
			getPointList();
		},
		deleteProdWish : function(prod_code){
			deleteProdWish(prod_code);
		},
		deleteBookingProdWish : function(prod_code){
			deleteBookingProdWish(prod_code);
		},
		'initRegularlyList': function(){
			initRegularlyList();
		},
		'getRegularlyOrderList': function(page){
			getRegularlyOrderList(page);
		},
		'getRegularlyCancelList': function(page){
			getRegularlyCancelList(page)
		},
		'registerRegularlyCard': function(is_update){
			registerRegularlyCard(is_update);
		},
		'deleteRegularlyCard': function(use_regularly_order){
			deleteRegularlyCard(use_regularly_order);
		},
		'changeRegularlyCard': function(){
			changeRegularlyCard();
		},
		'unsetRegularlyAllProd': function(idx){
			unsetRegularlyAllProd(idx);
		},
		'unsetRegularlyProdItem': function(idx, item_code,prod_check_code,item_code_list){
			unsetRegularlyProdItem(idx, item_code,prod_check_code,item_code_list)
		},
		'unsetRegularlyProd': function(type,idx, item_code,prod_check_code,item_code_list){
			unsetRegularlyProd(type,idx, item_code,prod_check_code,item_code_list);
		},
		'showRegularlyDateList': function(regularly_code,is_multiple_prod) {
			showRegularlyDateList(regularly_code,is_multiple_prod);
		},
		'getRegularlyDateList': function(regularly_code, page,is_multiple_prod){
			getRegularlyDateList(regularly_code, page,is_multiple_prod);
		},
		'showRegularlySelectPeriod': function(idx) {
			showRegularlySelectPeriod(idx);
		},
		'skipRegularlyProdAll': function(idx,date_text) {
			skipRegularlyProdAll(idx,date_text);
		},
		'skipRegularlyProdItem': function(idx, item_code,date_text,prod_check_code,item_code_list){
			skipRegularlyProdItem(idx, item_code,date_text,prod_check_code,item_code_list);
		},
		'skipRegularlyProd': function(type,idx, item_code,prod_check_code,item_code_list){
			skipRegularlyProd(type,idx, item_code,prod_check_code,item_code_list);
		},
		'showRegularlyChangeDetail' : function(idx,count,regularly_code,item_code){
			showRegularlyChangeDetail(idx,count,regularly_code,item_code);
		},
		'RegularlyChangeDetail' : function(idx,regularly_code,item_code,change_count){
			RegularlyChangeDetail(idx,regularly_code,item_code,change_count);
		},
		'trackingParcel' : function(code, no){
			trackingParcel(code, no);
		},
		'trackingParcelEcpay': function(code){
			trackingParcelEcpay(code);
		},
		'openMobileOrder' : function(no){
			openMobileOrder(no);
		},
		'initCancelOrder': function(order_code, auto_cancel_enable){
			initCancelOrder(order_code, auto_cancel_enable);
		},
		'cancelOrder': function(type){
			cancelOrder(type);
		},
		'returnOrder': function(){
			returnOrder();
		},
		'showExchangeDetail': function(exchange_idx){
			showExchangeDetail(exchange_idx);
		},
		'showReturnDetail': function(return_idx){
			showReturnDetail(return_idx);
		},
		'showCancelDetail' : function(cancel_idx){
			showCancelDetail(cancel_idx);
		},
		'exchangeOrder': function(){
			exchangeOrder();
		},
		'exchangeOrderPay': function(){
			exchangeOrderPay();
		},
		'withdrawReturnOrder': function(return_idx){
			withdrawReturnOrder(return_idx);
		},
		'withdrawExchangeOrder': function(exchange_idx){
			withdrawExchangeOrder(exchange_idx);
		},
		'withdrawCancelOrder': function(cancel_idx){
			withdrawCancelOrder(cancel_idx);
		},
		'cancelOrderSelectAllProdOrder': function(chk){
			cancelOrderSelectAllProdOrder(chk);
		},
		'cancelOrderSelectProdOrder': function(){
			cancelOrderSelectProdOrder();
		},
		'initReturnOrder': function(order_code, auto_cancel_enable){
			initReturnOrder(order_code, auto_cancel_enable);
		},
		'returnOrderSelectAllProdOrder': function(chk){
			returnOrderSelectAllProdOrder(chk);
		},
		'returnOrderSelectProdOrder': function(){
			returnOrderSelectProdOrder();
		},
		'returnOrderLoadRefundPriceData': function(){
			return returnOrderLoadRefundPriceData();
		},
		'changeReturnCollectMethod': function(collect_method){
			changeReturnCollectMethod(collect_method);
		},
		'changeExchangeCollectMethod': function(collect_method){
			changeExchangeCollectMethod(collect_method);
		},
		'initExchangeOrder': function(order_code, auto_cancel_enable){
			initExchangeOrder(order_code, auto_cancel_enable);
		},
		'exchangeOrderSelectAllProdOrder': function(chk){
			exchangeOrderSelectAllProdOrder(chk);
		},
		'requestCashReceipt' : function(order_no, mode){
			requestCashReceipt(order_no, mode);
		},
		'requestCashReceiptProc' : function(q, cash_receipt_type, cash_receipt_value){
			requestCashReceiptProc(q, cash_receipt_type, cash_receipt_value);
		},

		'openChangeOrderAddress': function(q) {
			openChangeOrderAddress(q);
		},
		'changeDelivAddressCountrySelect' : function(q) {
			changeDelivAddressCountrySelect(q);
		},
		"openChangeCVSAddress": function(cvs, order_no){
			openChangeCVSAddress(cvs, order_no);
		},
		"updateCVSAddress": function(data){
			updateCVSAddress(data);
		},
		"digitalFileDownload": function(prod_no, order_idx, is_expired) {
			digitalFileDownloadByProdOrder(prod_no, order_idx, is_expired);
		}
	}
}();