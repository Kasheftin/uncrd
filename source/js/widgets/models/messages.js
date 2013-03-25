define(["jquery","knockout"], function($,ko) {
	var Messages = function(o) {
		var self = this;

		var d = o.options;

		this.modalWindow = d.modalWindow;
		this.data = ko.observable();
		this.loading = ko.observable(false);

		this.modalWindow.header("Мои сообщения");

		this.loadData = function(callback) {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "getMessagesRows"
				},
				success: function(result) {
					if (result.success) {
						self.data(result.data.rows);
					}
					if (result.error) {
						self.core.error(result.error,self.modalWindow);
					}
					self.loading(false);
					self.emit("ready");
				}
			});
		}

		this.preparedData = ko.computed(function() {
			var out = $.extend([],self.data());
			out = $.map(out,function(rw) {
				rw.gotoUserProfile = function(context,e) {
					self.core.open({name:"profile",id:rw.user.id,loading:"after",callback: function() { 
						self.modalWindow.destroy();	
					}},context,e);
				}
				rw.gotoMessageRow = function(context,e) {
					self.core.open({name:"messageRow",to_id:rw.user.id,loading:"after",windowName:"messages"},context,e);
				}
				return rw;
			});
			return out;
		});

		this.requiresLoading = true;
		this.loadData();
	}

	return Messages;
});