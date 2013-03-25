define(["knockout"],function(ko) {
	var PhotoHeader = function(o) {
		var self = this;
		var rw = o.options.rw;

		this.photoPage = o.options.photoPage;
		this.photo = this.photoPage.photo;
		this.mode = this.photoPage.mode;

		this.context = this.photoPage.photoContext;
		this.contextName = this.photoPage.photoContextName;
		this.contextUser = this.photoPage.photoContextUser;
		this.photosCnt = this.photoPage.photosCnt;

		this.openContext = function() {
			self.mode("context");
		}

		this.openUser = function(context,e) {
			if (self.contextUser)
				self.core.open({name:"profile",id:self.contextUser().id,loading:"after"},context,e);
		}
	}

	return PhotoHeader;
})