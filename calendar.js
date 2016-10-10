
/**
 * javascript日历控件
 * @author tugenhua
 */

 function Calendar(options,callback){
	var self = this;
	self.options = $.extend({},defaults,options || {});
	self.targetCls = $(self.options.targetCls);
	if(self.targetCls.length < 1) {return;}
	self.language = self.options.language;
	self.flag = false;
	self.callback = callback;

	self._init();
	self._bindEnv();
	
 };
 $.extend(Calendar.prototype,{
	
	_init: function(){
		var self = this;
		// 先渲染日历面板
		self._renderCalendarPanel();
	},
	_renderCalendarPanel: function(){
		var self = this,
			options = self.options;
		// 如果input输入框有日期的话 
		if(self.targetCls.val().length > 0) {
			self.date = self._dateParse(self.targetCls.val());
		}
		self.date = new Date(self.date);
		if(isNaN(self.date.getFullYear())){
			self.date = new Date();
		}
		var defYear = self.date.getFullYear(),
			defMonth = self.date.getMonth() + 1,
			defDay = self.date.getDate();

		// 定义每月的天数
		self.month_day = new Array(31,28+self._leapYear(defYear),31,30,31,30,31,31,30,31,30,31);

		// 定义每周的日期
		self.date_name_week = self.language.weekList;

		// 定义周末
		var saturday = 6 - options.wdays,
			sunday = (7-options.wdays >= 7) ? 0 : (7-options.wday);
		
		// 创建日历面板dom节点
		var date_pane = $('<div class="cxcalendar"></div>'),
			date_hd = $('<div class="date_hd"></div>').appendTo(date_pane),
			date_table = $('<table class="date_table"></table>').appendTo(date_pane);
		date_hd.html("<a class='date_pre' href='javascript://' rel='prev'>&lt;</a><a class='date_next' href='javascript://' rel='next'>&gt;</a>");
		
		var date_txt = $('<div class="date_txt"></div>').appendTo(date_hd),
			date_set = $('<div class="date_set"></div>').appendTo(date_hd),
			html = "";

		for(var i = options.beginyear; i < options.endyear; i++) {
			html +="<option value='"+i+"'>"+i+"</option>";
		}
		var year_list = $('<select class="year_set"></select>').html(html).appendTo(date_set).val(defYear);
		
		date_set.append(" - ");
		html = '';
		for(var i = 0; i < 12; i++) {
			html += '<option value="'+(i+1)+'">'+self.language.monthList[i]+'</option>';
		}
		var month_list = $('<select class="month_set"></select>').html(html).appendTo(date_set).val(defMonth);
		html = '<thead><tr>';
		// 遍历一周7天
		for(var i = 0; i < 7; i++) {
			html += "<th class='"
			// 周末高亮
			if(i == saturday) {
				html+= " sat";
			}else if(i == sunday) {
				html+= " sun";
			};
			html+="'>";
			html+= (i+options.wday * 1 < 7) ? self.date_name_week[i+options.wday] : self.date_name_week[i+options.wday - 7];
			html+="</th>";
		};
		html +="</tr></thead>";
		html +="<tbody></tbody>";
		date_table.html(html);

		// 面板及背景遮挡层插入到页面中
		date_pane.appendTo("body");

		// 创建遮罩层的目地是：只显示一个日历面板
		var block_bg=$("<div class='cxcalendar_lock'></div>").appendTo("body");
		
		// 赋值 全局
		self.dateTxt = date_txt;
		self.yearList = year_list;
		self.monthList = month_list;
		self.dateTable = date_table;
		self.saturday = saturday;
		self.sunday = sunday;
		self.datePane = date_pane;
		self.blockBg = block_bg;
		self.dateSet = date_set;
		self.defYear = defYear;
		self.defMonth = defMonth;

		// 根据年份 月份来渲染天
		self._renderBody(defYear,defMonth);
	},
	_dayNumOfMonth: function(Year,Month){
		var d = new Date(Year,Month,0);
		return d.getDate();
	},
	/*
	 * 渲染日历天数
	 * @param {y,m} 年 月
	 */
	_renderBody: function(y,m){
		var self = this;
		var options = self.options;
		if(m < 1) {
			y--;
			m = 12;
		}else if(m > 12) {
			y++;
			m = 1;
		}
		var tempM = m,
			cur_m = m;

		m--;  // 月份从0开始的
		var prevMonth = tempM - 1,  //上个月的月份
			prevDay = self._dayNumOfMonth(y,tempM - 1), // 上个月的天数
			nextMonth = tempM + 1,   // 下个月的月份
			nextDay = self._dayNumOfMonth(y,tempM + 1),  //下个月的天数
			curDay = self._dayNumOfMonth(y,tempM);       // 当前月份的天数

		self.month_day[1]=28+self._leapYear(y);  //闰年的话 29天 否则 28天
		var temp_html = "",
			temp_date = new Date(y,m,1);
		var now_date = new Date();
		now_date.setHours(0);
		now_date.setMinutes(0);
		now_date.setSeconds(0);
		
		// 如果输入框有值的话
		if(self.targetCls.val().length > 0) {
			var val_date=self._dateParse(self.targetCls.val())
		}
		val_date=new Date(val_date);
		if(isNaN(val_date.getFullYear())){
			val_date=null;
		};
		// 获取当月的第一天
		var firstDay = temp_date.getDay() - options.wday < 0 ? temp_date.getDay() - options.wday + 7 : temp_date.getDay() - options.wday;
		// 每月所需要的行数
		var monthRows = Math.ceil((firstDay+self.month_day[m]) / 7);
		var td_num,
			day_num,
			diff_now,
			diff_set;
		var disabled;
		for(var i= 0; i < monthRows; i++) {
			temp_html += "<tr>";
			for(var j = 0; j < 7; j++) {
				td_num=i*7+j;
				day_num=td_num-firstDay+1;
				if(day_num<=0) {
					if(day_num == 0) {
						day_num = prevDay - day_num
						text_m = prevMonth
					}else {
						day_num = prevDay + day_num;
						text_m = prevMonth
					}
					
				}else if(day_num > self.month_day[m]){
					day_num = day_num - curDay;
					text_m = nextMonth
				}else {
					text_m 	= cur_m;
				}
				temp_html+="<td";
				if(typeof(day_num) == 'number') {
					diff_now=null;
					diff_set=null;
					temp_date = new Date(y,m,day_num);

					if(text_m == cur_m) {
						diff_now=Date.parse(now_date)-Date.parse(temp_date);
						diff_set=Date.parse(val_date)-Date.parse(temp_date);
					}
					if(cur_m > text_m || cur_m < text_m) {
						disabled = 'disabled';
					}else {
						disabled = "";
					}
					temp_html+=(" title='"+y+options.separator+tempM+options.separator+day_num+"' class='num "+disabled+"");

					// 高亮周末、今天、选中
					if(diff_set==0){    //选中的时候 增加select 类名
						temp_html+=" selected";
					}else if(diff_now==0){
						temp_html+=" now";   // 当前时间增加now类名
					}else if(j==self.saturday){
						temp_html+=" sat";   // 周六增加sat类名
					}else if(j==self.sunday){
						temp_html+=" sun";   // 周日增加sun类名
					};
					temp_html+=("'");
				};
				temp_html+=(" data-day='"+day_num+"'>"+day_num+"</td>");
			}
			temp_html+="</tr>";
		}
		$(self.dateTable).find("tbody").html(temp_html);
		$(self.dateTxt).html("<span class='y'>"+y+"</span>"+options.language.year+"<span class='m'>"+options.language.monthList[m]+"</span>"+options.language.month);
		$(self.yearList).val(y);
		$(self.monthList).val(m+1);
		
		return this;
	},
	_dateParse: function(date){
		var newdate = date;
		newdate=newdate.replace(/\./g,"/");
		newdate=newdate.replace(/-/g,"/");
		newdate=newdate.replace(/\//g,"/");
		newdate=Date.parse(newdate);
		return newdate;
	},
	/*
	 * 判断是否是闰年
	 * @param y 年份
	 * 1.能被4整除且不能被100整除 2.能被100整除且能被400整除
	 */
	_leapYear: function(y) {
		return ((y%4==0 && y%100!=0) || y%400==0) ? 1 : 0;
	},
	_bindEnv: function(){
		var self = this;
		$(self.targetCls).unbind('click').bind('click',function(){
			self.show();
		});

		// 关闭面板事件
		self.blockBg.unbind('click').bind("click",function(){
			self.hide();
		});

		// 点击上一页 下一页事件
		self.datePane.delegate('a','click',function(){
			if(!this.rel){return};
			var _rel = this.rel;
			if(_rel == 'prev') {
				self._renderBody(self.yearList.val(),parseInt(self.monthList.val(),10) -1);	
				return;
			}else if(_rel == 'next') {
				self._renderBody(self.yearList.val(),parseInt(self.monthList.val(),10) +1);
				return;
			}
		});

		// 选择日期事件
		self.datePane.delegate('td','click',function(){
			var _this = $(this);
			if(_this.hasClass('num') && !_this.hasClass('disabled')) {
				self.dateTable.find("td").removeClass("selected");
				_this.addClass("selected");
				var day = _this.attr("data-day");
				self._selectDay(day);
			}
		});
		
		// 显示年月选择
		self.dateTxt.unbind('click').bind("click",function(){
			self.dateTxt.hide();
			self.dateSet.show();
		});

		//更改年月事件
		self.yearList.unbind('change').bind("change",function(){
			self._renderBody(self.yearList.val(),self.monthList.val());
		});
		self.monthList.unbind('change').bind("change",function(){
			self._renderBody(self.yearList.val(),self.monthList.val());
		});
	},
	/* 
	 * 选择某一天的时候 把值存入输入框里 且面板隐藏
	 * @_selectDay {private}
	 */
	_selectDay: function(d) {
		var self = this;
		var year,
			month;
		month = self.monthList.val();
		day = d;
		var options = self.options;
		if(options.type == 'yyyy-mm-dd') {
			month="0" + self.monthList.val();
			day= "0" + d;
			month=month.substr((month.length-2),month.length);
			day=day.substr((day.length-2),day.length);
		}
		self.targetCls.val(self.yearList.val()+options.separator+month+options.separator+day);
		self.hide();

		self.callback && $.isFunction(self.callback) && self.callback(self.yearList.val()+options.separator+month+options.separator+day);
		return this;
	},
	/*
	 * 显示日历面板
	 * @method  show {public}
	 */
	show: function(){
		var self = this;
		if(self.flag) {
			return;
		}
		var doc_w = document.body.clientWidth,
			doc_h = document.body.clientHeight,
			pane_top = self.targetCls.offset().top,
			pane_left = self.targetCls.offset().left,
			obj_w = self.targetCls.outerWidth(),
			obj_h = self.targetCls.outerHeight();
		pane_top= pane_top+obj_h;
		self.datePane.css({"top":pane_top,"left":pane_left}).show();
		self.blockBg.css({width:doc_w,height:doc_h}).show();
		self.flag = true;
		return this;
	},
	/*
	 * 清除日期
	 * @method clear {public}
	 */
	clear: function(){
		var self = this;
		self.targetCls.val('');
		self._renderBody(self.defYear,self.defMonth);
		self.hide();
		return this;
	},
	/*
	 * 获取当前选中的日期
	 * @method getValue {public}
	 * @return val
	 */
	 getValue: function(){
		var self = this;
		return self.targetCls.val();
	 },
	/*
	 * 隐藏日历面板
	 */
	hide: function(){
		var self = this;
		if(!self.flag) {return;}
		self.datePane.hide();
		self.blockBg.hide();
		self.dateSet.hide();
		self.dateTxt.show();
		self.flag = false;
		return this;
	}
 });

 var defaults = {
	targetCls        :        '',             //渲染日历的class
	beginyear        :        1978,           //开始年份
	endyear          :        2050,           //结束年份
	date             :        new Date(),     // 默认日期
	type             :        "yyyy-mm-dd",	  // 日期格式
	separator        :        "-",			  // 日期链接符
	wday             :        0,			  // 周第一天
	language         :       {
								year:"年",
								month:"月",
								monthList:["1","2","3","4","5","6","7","8","9","10","11","12"],
								weekList:["日","一","二","三","四","五","六"]}
 };