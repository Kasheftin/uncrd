define(["jquery","knockout"], function($,ko) {
	var VideoPage = function(o) {
		var self = this;

		this.modalWindow = o.options.modalWindow;

		this.requiresLoading = true;
		this.loading = ko.observable(true);

		this.videoId = ko.observable(o.options.id);
		this.videoData = ko.observable(null);

		this.routerUpdater = ko.computed(function() {
			self.core.router.set({name:"video",id:self.videoId()});
		}).extend({throttle:200});

		this.video = ko.computed(function() {
			if (!self.videoId() || !self.videoData()) return null;
			var rw = self.videoData();
			if (self.videoUsers && self.videoUsers[rw.user])
				rw.user = self.videoUsers[rw.user];
			rw.commentsData = {posts:self.videoComments,users:self.videoUsers};
			rw.my = ko.computed(function() {
				if (!self.core.user()) return false;
				if (rw.user.id == self.core.user().id) return true;
				return false;
			});
			return rw;
		});

		this.loadVideo = function() {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "getVideo",
					id: self.videoId()
				},
				success: function(result) {
					self.loading(false);
					if (result.success) {
						self.videoUsers = result.data.videoUsers;
						self.videoComments = result.data.videoComments;
						self.videoData(result.data.video);
						self.modalWindow.headerWidget({name:"videoHeader",videoPage:self});
						self.modalWindow.width(830);
						self.modalWindow.cssPosition("absolute");
					}
					if (result.error) {
						self.core.error(result.error);
						self.modalWindow.destroy();
					}
					self.emit("ready");
				}
			});
		}

		this.domInit = function(obj,element,firstDomChild) {
			self.loadVideo();
		}
	}

	return VideoPage;
});