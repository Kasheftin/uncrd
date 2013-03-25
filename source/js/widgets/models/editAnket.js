define(["jquery","knockout"],function($,ko) {
	var EditAnket = function(o) {
		var self = this;
		var d = o.options;

		this.loading = ko.observable(false);
		this.modalWindow = o.options.modalWindow;
		this.modalWindow.width(1000);
		this.modalWindow.cssPosition("absolute");
		this.modalWindow.header("Редактирование анкетных данных");

		this.anket = ko.observableArray([]);

		this.loadData = function() {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "editProfile"
				},
				success: function(result) {
					self.loading(false);
					if (result.success) {
						var user = result.data.userData;
						if (user.id != self.core.user().id)
							self.core.error("Ошибка доступа",self.modalWindow);

						self.anket([]);
						$.each(user.anket,function(i,rwGroup) {
							var data = [];
							$.each(rwGroup.data,function(i,rw) {
								var values = [];
								if (rw.type.match(/choose|select/)) {
									$.each(rw.opts,function(i,opt) {
										values.push(ko.observable(1<<i & rw.num ? true:false));
									});
								}
								data.push($.extend(rw,{
									num: ko.observable(rw.num),
									text: ko.observable(rw.text),
									values: values
								}));
							});
							self.anket.push($.extend(rwGroup,{data:data}));
						});
					}
					if (result.error) {
						self.core.error(result.error,self.modalWindow);
					}
					console.log("anket",ko.toJS(self.anket));
					self.emit("ready");
				}
			});
		}

		if (!this.core.user())
			return this.core.error("Страница доступна только для зарегистрированных пользователей",this.modalWindow);
		this.requiresLoading = true;
		this.loadData();

		this.form = {
			loading: ko.observable(false),
			send: function() {
				self.form.loading(true);
				self.form.ajax = self.core.apiCall({
					data: {
						action: "updateAnket",
						formData: {
							anket: ko.toJS(self.anket)
						}
					},
					success: function(result) {
						delete self.form.ajax;
						self.form.loading(false);
						if (result.success) {
							self.core.open({name:"alert",windowName:"alert",type:"info",message:result.success,callback: function() {
								self.modalWindow.destroy();
							}});
						}
						if (result.error) {
							self.core.error(result.error);
						}
					},
					error: function() { }
				});
			},
			cancelSend: function() {
				self.form.loading(false);
				if (self.form.ajax)
					self.form.ajax.abort();
				delete self.form.ajax;
			}
		}

		this.modalWindow.footerWidget({
			name: "editProfileFooter",
			modalWindow: self.modalWindow,
			form: self.form
		});

	}

	return EditAnket;
});
