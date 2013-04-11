define(["jquery","knockout"],function($,ko) {
	var BlogForm = function(o) {
		var self = this;
		var d = o.options;

		this.modalWindow = d.modalWindow;
		this.to_type = this.asObservable(d.to_type,0);
		this.to_id = this.asObservable(d.to_id,0);
		this.id = this.asObservable(d.id,0);
		this.data = this.asObservable(d.data,{})
		this.blogsSections = ko.observableArray([]);
		this.onUpdate = d.onUpdate;

		if (!this.id() && this.data()) {
			this.id(this.data().id);
		}

		this.loading = ko.observable(false);

		this.loadData = function() {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "getBlog",
					id: self.id(),
					formData: {
						to_type: self.to_type(),
						to_id: self.to_id()
					}
				},
				success: function(result) {
					self.loading(false);
					if (result.success) {
						if (result.data.blog)
							self.data(result.data.blog);
						if (result.data.blogsSections) {
							$.each(result.data.blogsSections,function(i,rw) {
								self.blogsSections.push(rw);
							});
							self.blogsSections.push({id:0,title:"- Создать новый раздел"});
						}
					}
					if (result.error) {
						self.core.error(result.error);
					}
					self.emit("ready");
				}
			});
		}

		if (!d.hasOwnProperty("blogsSections")) {
			this.requiresLoading = true;
			this.loadData();
		}
		else {
			$.each(d.blogsSections,function(i,rw) {
				self.blogsSections.push(rw);
			});
			self.blogsSections.push({id:0,title:"- Создать новый раздел"});
		}

		this.form = {
			loading: ko.observable(false),
			id: this.id,
			title: ko.observable(""),
			text: ko.observable(""),
			section: ko.observable(0),
			newSectionTitle: ko.observable(""),
			send: function() {
				self.form.loading(true);
				self.form.ajax = self.core.apiCall({
					data: {
						action: "updateBlog",
						id: self.form.id(),
						formData: {
							id: self.form.id(),
							to_type: self.to_type(),
							to_id: self.to_id(),
							title: self.form.title(),
							text: self.form.text(),
							section: self.form.section(),
							newSectionTitle: self.form.newSectionTitle()
						}
					},
					success: function(result) {
						self.form.loading(false);
						delete self.form.ajax;
						if (result.success) {
							if (self.onUpdate && typeof self.onUpdate == "function")
								self.onUpdate(result.data);
							self.core.open({name:"alert",windowName:"alert",type:"success",message:result.success,callback: function() {
								self.modalWindow.destroy();
							}});
						}
						if (result.error) {
							self.core.error(result.error);
						}
					},
					error: function() {

					}
				});
			},
			cancelSend: function() {
				self.form.loading(false);
				if (self.form.ajax)
					self.form.ajax.abort();
				delete self.form.ajax;
			}
		}

		this.add = function(str) {
			return self.addTag.bind(self,str);
		}

		this.addTag = function(str) {
			if (self.textarea) {
				self.textarea.insertAroundCursor("[" + str + "]","[/" + str + "]");
			}
		}

		this.createNewSection = ko.computed(function() {
			return self.form.section() == 0;
		});

		this.data.subscribe(function(data) {
			self.form.title(data ? data.title : "");
			self.form.text(data ? data.editText : "");
			self.form.section(data ? data.section : "");
		});


		if (this.modalWindow) {
			this.id.subscribe(function(id) {
				if (self.id() > 0)
					self.modalWindow.header("Редактировать пост");
				else
					self.modalWindow.header("Добавить новый пост");
			});
			this.modalWindow.footerWidget({
				name: "blogFormFooter",
				modalWindow: self.modalWindow,
				form: self.form
			});
			this.modalWindow.width(700);
		}

		this.domInit = function(obj,element,firstDomChild) {
			self.textarea = $(firstDomChild).find("textarea");
		}

		self.id.valueHasMutated();
		self.data.valueHasMutated();
	}

	return BlogForm;
});