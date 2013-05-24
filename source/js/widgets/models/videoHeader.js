define(["knockout"],function(ko) {
	var VideoHeader = function(o) {
		var self = this;
		var rw = o.options.rw;

		this.videoPage = o.options.videoPage;
		this.video = this.videoPage.video;

		this.openUser = function(context,e) {
			if (self.contextUser)
				self.core.open({name:"profile",id:self.video().user.id,loading:"after"},context,e);
		}
	}

	return VideoHeader;
})