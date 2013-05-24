define(["jquery","knockout","jquery-cookie"], function($,ko) {
	var UserDataNotifications = function(o) {
		var self = this;

		this.modalWindow = o.options.modalWindow;

		if (this.core.user() && this.core.user().just_registered)
			this.modalWindow.header("Регистрация завершена");
		else
			this.modalWindow.header("Внимание");

		this.showAutoGeoLocation = ko.observable(false);
		this.autoGeoLocation = ko.observable(null);
		this.loading = ko.observable(true);

		if (this.core.user() && parseInt(this.core.user().country_id) == 0) {
			this.core.apiCall({
				data: {
					action: "setAutoGeoLocation"
				},
				success: function(result) {
					if (result.success) {
						self.autoGeoLocation(result.data.location.locationText);
						self.showAutoGeoLocation(true);
						var u = self.core.user();
						u.city_id = result.data.location.city_id;
						u.country_id = result.data.location.country_id;
						self.core.user(u);
					}
					self.loading(false);
					self.modalWindow.recalculatePosition(true);
				}
			});
		}
		else {
			self.loading(false);
		}
		
	}
	return UserDataNotifications;
});