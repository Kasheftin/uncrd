define(["jquery","knockout"], function($,ko) {
	var ManageFriendControl = function(o) {
		var self = this;
		var d = o.options;

		this.to_id = ko.utils.unwrapObservable(d.to_id);
		this.type = d.type || "link";
		this.css = d.css || "";

		var p = {
			name: "friendForm",
			to_id: this.to_id,
			loading: d.loading || "after",
			windowName: d.windowName || "friendForm"
		}
		if (d.data) p.data = d.data;

		this.addParams = $.extend({},p,{action: "add"});
		this.addText = d.addText || "Добавить в друзья";

		this.remParams = $.extend({},p,{action:"remove"});
		this.remText = d.remText || "Удалить из друзей";

		this.isMy = ko.computed(function() {
			return (self.core.user() && self.core.user().id == self.to_id);
		});

		this.isFriend = ko.computed(function() {
			return self.core.isFriend(self.core.user(),self.to_id);
		});
	}

	return ManageFriendControl;
});