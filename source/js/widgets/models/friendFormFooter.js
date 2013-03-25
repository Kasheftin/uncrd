define(["jquery","knockout"], function($,ko) {
	var FriendFormFooter = function(o) {
		var self = this;
		var d = o.options;
		this.form = d.form;
		this.isFriend = d.isFriend;
		this.modalWindow = d.modalWindow;
		this.close = function() {
			self.modalWindow.destroy();
		}
	}

	return FriendFormFooter;
});