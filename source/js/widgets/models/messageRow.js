define(["jquery","knockout"], function($,ko) {
	var MessageRow = function(o) {
		var self = this;

		var d = o.options;

		this.to_id = this.asObservable(d.to_id,0);
		this.user = ko.observable(null);
		this.modalWindow = d.modalWindow;
		this.loading = ko.observable(false);
		this.data = ko.observable({posts:[],users:{}});

		// last_message_id нужен чтобы не гонять лишние данные - каждые 10 секунд идет запрос за новыми сообщениями
		this.last_message_id = 0;
		this.check_interval = 5;
		this.highlightMessages = false;

		this.modalWindow.header("История переписки");

		this.updateData = function(ar) {
			var data = self.data();
			$.each(ar.posts || [],function(i,rw) {
				data.posts.push(rw);
			});
			$.each(ar.users || [],function(i,rw) {
				data.users[rw.id] = rw;
			});
			self.data(data);
		}

		this.form = {
			text: ko.observable(""),
			loading: ko.observable(false),
			send: function() {
				if (self.form.text().length == 0) return;
				self.form.loading(true);
				self.form.ajax = self.core.apiCall({
					data: {
						action: "createMessage",
						formData: {
							text: self.form.text(),
							to_id: self.to_id()
						}
					},
					success: function(result) {
						delete self.form.ajax;
						self.form.loading(false);
						if (result.success) {
							self.updateData(result.data);
							self.form.reinitialize();
						}
						if (result.error) {
							self.core.error(result.error);
						}
					}
				});
			},
			cancelSend: function() {
				self.form.loading(false);
				if (self.form.ajax)
					self.form.ajax.abort();
				delete self.form.ajax;
			},
			reinitialize: function() {
				self.form.text("");
				self.form.loading(false);
			}
		}

		this.loadData = function(callback) {
			self.loadDataAjax = self.core.apiCall({
				data: {
					action: "getMessageRow",
					formData: {
						to_id: self.to_id(),
						last_message_id: self.last_message_id
					}
				},
				success: function(result) {
					if (result.success) {
						self.updateData(result.data);
					}
					if (result.error) {
						self.core.error(result.error,self.modalWindow);
					}
					if (typeof callback == "function")
						callback();
				},
				error: function() {

				}
			});
		}

		this.preparedData = ko.observableArray([]);

		this.data.subscribe(function(data) {
			var used_ids = {};
			var prepared_ids = {};
			$.each(self.preparedData(),function(i,rw) {
				prepared_ids[rw.id] = true;
			});
			$.each(data.posts,function(i,rw) {
				self.last_message_id = Math.max(self.last_message_id,rw.id);
				if (used_ids[rw.id] || prepared_ids[rw.id]) return;
				used_ids[rw.id] = true;
				self.preparedData.push($.extend(rw,{
					user: self.data().users[rw.from_id],
					gotoUserProfile: function(context,e) {
						self.core.open({name:"profile",id:rw.from_id,loading:"after",callback: function() {
							self.modalWindow.destroy();							
						}},context,e);
					}
				}));
			});
			if (data.users[self.to_id()])
				self.modalWindow.header("Переписка с пользователем " + data.users[self.to_id()].name);
			self.highlightMessages = true;
		});

		this.scrollToBottom = function(cycle) {
			if (self.messagesListDOM) 
				self.messagesListDOM.scrollTop = self.messagesListDOM.scrollHeight;
			if (!cycle) cycle = 0;
			if (cycle < 3)
				setTimeout(function() {
					self.scrollToBottom(cycle+1);
				},300);
		}

		this.preparedData.subscribe(function() {
			self.scrollToBottom();
		});

		this.modalWindow.footerWidget({
			name: "messageRowFooter",
			modalWindow: self.modalWindow,
			form: self.form
		});

		this.requiresLoading = true;
		this.loading(true);

		var intervalCycler = function() {
			self.loadData(function() {
				self.checkTimeout = setTimeout(intervalCycler,self.check_interval*1000);
			});
		}

		self.loadData(function() {
			self.loading(false);
			self.emit("ready");
			self.checkTimeout = setTimeout(intervalCycler,self.check_interval*1000);
		});

		this.hlRow = function(elem) {
			if (self.highlightMessages && elem.nodeType == 1) {
				$(elem).css("background-color","#d9edf7").animate({backgroundColor:"#ffffff"},2000);
			}
		}

		this.domInit = function(obj,element,firstDomChild) {
			self.messagesListDOM = $(firstDomChild).find(".uncrd-messages-list").get(0);
		}

		this.domDestroy = function() {
			clearTimeout(self.checkTimeout);
			if (self.loadDataAjax) self.loadDataAjax.abort();
		}
	}

	return MessageRow;
});