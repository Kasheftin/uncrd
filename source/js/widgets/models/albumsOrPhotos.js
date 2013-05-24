define(["jquery","knockout"], function($,ko) {
	var AlbumsOrPhotos = function(o) {
		var self = this;

		var d = o.options;

		// если data не передана, делается запрос с этими параметрами
		this.to_type = this.asObservable(d.to_type,0);
		this.to_id = this.asObservable(d.to_id,0);

		if (!this.to_id() && this.core.user())
				this.to_id(this.core.user().id);
			
		this.loading = ko.observable(false);
		this.modalWindow = o.options.modalWindow;

		if (this.to_id()) {
			self.requiresLoading = true;
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "getAlbums",
					formData: {
						to_type: self.to_type(),
						to_id: self.to_id()
					}
				},
				success: function(result) {
					if (result.success) {
						if (result.data.albums) {
							if (result.data.albums.length == 1 && result.data.albums[0].photo) {
								self.widget = $.extend(d,{
									name: "photo",
									id: result.data.albums[0].photo.id,
									mode: "albums",
									modalWindow: self.modalWindow
								});
							}
							else {
								self.widget = $.extend(d,{
									name: "albums",
									data: {albums:result.data.albums},
									modalWindow: self.modalWindow
								});
							}
						}
					}
					if (result.error) {
						self.core.error(result.error);
					}
					self.loading(false);
					self.emit("ready");
				}
			});
		}
	}

	return AlbumsOrPhotos;
});