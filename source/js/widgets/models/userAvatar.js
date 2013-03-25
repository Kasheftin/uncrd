define(["jquery","knockout"], function($,ko) {
	var UserAvatar = function(o) {
		this.user = ko.utils.unwrapObservable(o.options.user);
		this.type = o.options.type || "small";
		this.src = o.options.src || "";
		this.css = (o.options.css || "") + " uncrd-avatar-" + this.type;

		if (this.src.length == 0 && this.user)
			this.src = this.user["photo_" + this.type];
	}

	return UserAvatar;
});