define(["jquery","knockout"], function($,ko) {
	var MainPage = function(o) {
		var self = this;

		this.state = o.options.data;
		this.state.page = this.state.subpage;
		delete this.state.subpage;

		this.modalWindow = o.options.modalWindow;
		this.modalWindow.width(1000);
		this.modalWindow.cssPosition("absolute");
		this.modalWindow.recalculatePosition(true);

		this.updateState = ko.observable(0);
		this.currentWidget = null;

		this.pageWidgetBinding = ko.computed(function() {
			self.updateState();
			if (self.currentWidget)
				self.currentWidget.destroy({keepDOM:true});
			return {
				name: self.state.page,
				data: self.state,
				modalWindow: self.modalWindow,
				main: self,
				callback: function(w) {
					self.currentWidget = w;
				},
				open: function(data) {
					self.state = $.extend(true,self.state,data);
					self.updateState.notifySubscribers();
				}
			}
		});

		this.pages = ko.observableArray([
			{page:"profile",title:"Профиль"},
			{page:"about",title:"TEST"},
			{page:"contacts",title:"Контакты"},
			{page:"messages",title:"Сообщения"},
			{page:"news",title:"Новости"},
			{page:"fav",title:"Избранное"}
		]);


/*
		var page = o.options.data.subpage;
		this.page = (ko.isObservable(page) || ko.isComputed(page)) ? page : ko.observable(page);
		this.pageWidget = null;

		this.modalWindow = o.options.modalWindow;
		this.modalWindow.width(1020);


		this.open = function(obj) {
			console.log("open page",obj);
			self.page(obj.page);
//			if (self.childrenWidgets && self.childrenWidgets[page] && self.childrenWidgets[page].reInitialize)
//				self.childrenWidgets[page].reInitialize();
		}

		this.pageWidgetBinding = ko.computed(function() {
			return {
				name: self.page(),
				modalWindow: self.modalWindow,
				main: self,
				callback: function(pageWidget) {
					self.pageWidget = pageWidget;
					self.modalWindow.recalculatePosition(true);
				}
			}
		});


		this.page.subscribe(function(page) {
			console.log("main.js childrenWidgets page is changing, destroying current page",page,self.childrenWidgets);
			if (self.pageWidget)
				self.pageWidget.destroy({keepDOM:true});
			console.log("main.js childrenWidgets after destroy",self.childrenWidgets);
		},self,"beforeChange");

*/
/*
		this.page.subscribe(function(page) {
			console.log("main.js childrenWidgets",self.childrenWidgets);
			self.modalWindow.recalculatePosition(true);
		});
*/


/*
		this.open = function(page) {
			self.page(page);
			if (self.childrenWidgets && self.childrenWidgets[page] && self.childrenWidgets[page].reInitialize)
				self.childrenWidgets[page].reInitialize();
		}

		this.open(this.currentPageData().page + "Page");

		var pageSentInInitialization = this.currentPageData().page + "Page";
		this.page = ko.observable(pageSentInInitialization);

		this.page.subscribe(function(widgetName) {
			if (widgetName) {
				$.each(self.core.allWidgets,function(i,v) {
					if (v.widgetName == widgetName)
						v.destroy();
				});
			}
		},self,"beforeChange");


		var ar = this.currentPageData();
		ar.width = 980;
		this.currentPageData(ar);
*/
	}

	return MainPage;
});