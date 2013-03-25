define(["jquery","knockout"],function($,ko) {
	var ModalWindow = function(options) {
		console.log("ModalWindow initialize");
		var self = this;

		this.currentPage = options.options.currentPage;
		this.currentPageData = options.options.currentPageData;

		this.currentPage.subscribe(function(page) {
			console.log("ModalWindow currentPage subscribe run");
			self.element.modal(page?"show":"hide");
		});

		this.currentPageData.subscribe(function(ar) {
			console.log("ModalWindow currentPageData subscribe run");
			var w = ar && ar.width && ar.width != "auto" ? [ar.width,-ar.width/2] : [560,-280];
			self.element.css({"width":w[0],"margin-left":w[1]});
		});

/*
		this.core.modalWindow.currentPage.subscribe(function(page) {
			self.core.apiCall({
				data: {
					action: "getPage",
					formData: {
						page: page
					}
				},
				success: function(data,textStatus,jqXHR) {
					self.title(data.title);
					self.html(data.html);
					$(self.element).modal("show");
				}
			});
		});
*/
		this.title = ko.observable("");
	}

	ModalWindow.prototype.domInit = function(self,container,element) {
		self.element = $(element).on("hidden",function() {
			self.currentPage(null);
			self.currentPageData({});
		});
	}

	return ModalWindow;
})