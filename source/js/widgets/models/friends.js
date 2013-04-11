define(["jquery","knockout"], function($,ko) {
	var Friends = function(o) {
		var self = this;

		var d = o.options;
		this.limitStep = 6;
		this.limit = this.asObservable(d.limit,this.limitStep);
		this.data = this.asObservable(d.data,{});
		this.to_type = this.asObservable(d.to_type,0);
		this.to_id = this.asObservable(d.to_id,0);

		this.loading = ko.observable(false);
		this.modalWindow = o.options.modalWindow;

		// Есть 2 варианта - либо  вызвали из профиля и уже передали data, тогда просто ее выводим. Либо вызвали и не передали (и тогда this.data - обычный observable), тогда нужно ее загрузить
		if (!d.hasOwnProperty("data") && this.to_id()) {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "getFriends",
					formData: {
						to_type: self.to_type(),
						to_id: self.to_id()
					}
				},
				success: function(result) {
					self.loading(false);
					if (result.success) {
						self.data({friends:result.data.friends,users:result.data.users});
					}
					if (result.error) {
						self.core.error(result.error);
					}
				}
			});
		}

		this.friendsLimited = ko.computed(function() {
			var out = [];
			if (!self.data() || self.limit() <= 0) return out;
			var ar = $.extend([],self.data().friends);
			for (var i = 0; i < self.limit(); i++) {
				if (ar.length == 0) break;
				var r = Math.floor(Math.random()*ar.length);
				var u = $.extend({},self.data().users[ar[r]]);
				out.push(u);
				ar.splice(r,1);
			}
			return out;
		});
	}

	return Friends;
});