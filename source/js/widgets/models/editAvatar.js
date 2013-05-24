define(["jquery","knockout"],function($,ko) {
	var EditAvatar = function(o) {
		var self = this;
		var d = o.options;

		this.modalWindow = d.modalWindow;

		this.form = {
			loading: ko.observable(false),
			currentProgress: ko.observable(0),
			totalProgress: ko.observable(0),
			submit: function(form) {
				self.form.loading(true);
				self.form.currentProgress(0);
				self.form.totalProgress(0);
				var formData = new FormData(form);
				self.form.ajax = self.core.apiCall({
					xhr: function() {
						console.log("beforeXHR");
						var myXHR = $.ajaxSettings.xhr();
						if (myXHR.upload) {
							myXHR.upload.addEventListener("progress",function(e) {
								if (e.lengthComputable) {
									self.form.currentProgress(e.loaded);
									self.form.totalProgress(e.total);
								}
							});
						}
						return myXHR;
					},
					data: formData,
					cache: false,
					contentType: false,
					processData: false,
					success: function(result) {
						delete self.form.ajax;
						self.form.loading(false);
						if (result.success) {
							var u = self.core.user();
							u.photo_small = result.data.user.photo_small + "?r=" + Math.floor(Math.random()*1000);
							u.photo_middle = result.data.user.photo_middle + "?r=" + Math.floor(Math.random()*1000);
							self.core.user(u);
							self.modalWindow.destroy();
						}
						if (result.error) {
							self.core.error(result.error);
						}
					}
				});
				return false;
			},
			submitDestroy: function() {
				self.form.loading(true);
				self.form.currentProgress(0);
				self.form.totalProgress(0);
				self.form.ajax = self.core.apiCall({
					data: {
						action: "destroyAvatar"
					},
					success: function(result) {
						delete self.form.ajax;
						self.form.loading(false);
						if (result.success) {
							var u = self.core.user();
							delete u.photo_small;
							delete u.photo_middle;
							self.core.user(u);
							self.modalWindow.destroy();
						}
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
	}

	return EditAvatar;
});