define(["jquery","knockout"], function($,ko) {
	var UploadPhoto = function(o) {
		var self = this;

		this.src = ko.computed(function() {
			if (self.core.user())
				return "http://phototag.ru/uploadnew/getPhotoFlashForm.php?mode=photo&SID=" + self.core.user().SID + "&service_id=2";
			return "";
		});

		this.style = ko.observable({width:"640px",height:"440px",border:"0px"});
		o.options.modalWindow.header("Загрузка фото");
		o.options.modalWindow.width(670);
	}

	return UploadPhoto;
});
