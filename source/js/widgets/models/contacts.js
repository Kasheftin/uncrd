define(["jquery","knockout"], function($,ko) {
	var ContactsPage = function(o) {
		var self = this;

		o.options.modalWindow.header("Контакты");

		this.loading = ko.observable(false);
		this.q = ko.observable("");
		this.ageFrom = ko.observable("");
		this.ageTo = ko.observable("");
		this.selectedPlace = ko.observable();
		this.place = ko.computed(function() {
			return self.selectedPlace() ? self.selectedPlace.id : 0;
		});
		this.places = ko.observableArray([]);
		this.placesOptionsText = function(place) {
			return (place.parent > 0 ? " - " : "") + place.name;
		}
		this.sex = ko.observable(0);

		this.users = ko.observableArray([]);
		this.usersCount = ko.observable(0);

		this.ageFromValues = ko.computed(function() {
			var out = [""];
			var max = self.ageTo().length == "" ? 80 : self.ageTo();
			for (var i = 12; i <= max; i++)
				out.push(i);
			return out;
		});

		this.ageToValues = ko.computed(function() {
			var out = [""];
			var min = self.ageFrom().length == "" ? 12 : self.ageFrom();
			for (var i = min; i <= 80; i++)
				out.push(i);
			return out;
		});

		this.formSubmit = function() {
			if (self.form) {
				self.loading(true);
				var data = {action: "getUsers"};
				self.form.serializeArray().forEach(function(elem) {
					data[elem.name] = elem.value;
				});
				console.log(data);
				self.core.apiCall({
					data: data,
					success: function(data) {
						self.loading(false);
						console.log(data);
					}
				});
			}
		}

		this.formAutoSubmitter = ko.computed(function() {
			var tmp = self.q() + self.ageFrom() + self.ageTo() + self.place() + self.sex();
			self.formSubmit();
		});

		this.initialize = function() {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "initializeContactsFilter"
				},
				success: function(data) {
					self.loading(false);
					if (data.success)
						self.places(data.data.places);
					self.formSubmit();
				}
			});
		}

		this.domInit = function(obj,element,firstDomChild) {
			self.form = $(firstDomChild).find("form");
		}

		this.initialize();
	}

	return ContactsPage;
});