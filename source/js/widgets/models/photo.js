define(["jquery","knockout"], function($,ko) {
	var PhotoPage = function(o) {
		var self = this;

		this.modalWindow = o.options.modalWindow;

		this.requiresLoading = true;

		// общая загрузка, ajax, пока еще ничего нет
		this.loading = ko.observable(true);

		// загрузка img, когда данные есть, уже все нарисовано и грузится сама картинка
		this.photoLoading = ko.observable(true);

		this.photoId = ko.observable(o.options.id);
		this.photoContext = ko.observable(o.options.context || "default");
		this.photoContextName = ko.observable("");
		this.photoContextUser = ko.observable("");

		// mode=context - показывать альбом, mode=default - показывать одно фото
		this.mode = ko.observable(o.options.mode || "default");

		var routerUpdater = ko.computed(function() {
			if (self.mode() != "default")
				self.core.router.set({name:"photo",id:self.photoId(),mode:self.mode()});
			else
				self.core.router.set({name:"photo",id:self.photoId()});
			self.modalWindow.recalculatePositionTrue();
			self.modalWindow.leftBackdropAction(null);
		});

		this.photos = ko.observableArray([]);
		this.photosCnt = ko.computed(function() {
			return self.photos().length;
		});

		this.photosAssoc = ko.computed(function() {
			var out = {};
			$.each(self.photos(),function(i,elem) {
				elem.n = i + 1;
				out[elem.id] = elem;
			});
			return out;
		});

		// Высота контейнера со списком фото в альбоме
		this.photosHeight = ko.computed(function() {
			return (135 * Math.ceil(self.photos().length/4)).toString() + "px";
		});

		this.photosUsers = {};
		this.photosComments = [];
		this.photosCnt = 0;

		this.photo = ko.computed(function() {
			if (!self.photosAssoc() || !self.photoId() || self.photoId() == 0) return null;
			var rw = self.photosAssoc()[self.photoId()];

			if (!rw) return null;
			if (self.photosUsers && self.photosUsers[rw.user])
				rw.user = self.photosUsers[rw.user];

			rw.commentsData = {posts:[],users:[]};
			if (self.photosComments) {
				$.each(self.photosComments,function(i,elem) {
					if (elem.to_id == rw.id) {
						rw.commentsData.posts.push(elem);
						rw.commentsData.users[elem.user] = self.photosUsers[elem.user];
					}
				});
			}

			self.photoLoading(true);
			var img = document.createElement("img");
			img.onload = function() {
				self.photoLoading(false);
				self.modalWindow.recalculatePosition(true);
			}
			img.onerror = function() {
				self.photoLoading(false);
				self.modalWindow.recalculatePosition(true);
				self.core.error("Ошибка загрузки фото");
			}
			img.src = rw.src_big;

			if (rw.prevPhotoId > 0)
				self.modalWindow.leftBackdropAction(function() {
					self.photoId(rw.prevPhotoId);
				});

			return rw;
		});

		this.loadPhoto = function() {
			self.loading(true);
			self.photoLoading(true);
			self.core.apiCall({
				data: {
					action: "getPhoto",
					id: self.photoId(),
					context: self.photoContext()
				},
				success: function(result) {
					self.loading(false);
					if (result.success) {
						// Сначала присваиваем не observables, потом - self.photos, она дергает self.photo, и в нем - правильные данные из необзерваблов 
						// При этом если mode=album (т.е. после загрузки нужно показать не само фото, а альбом), сначала обнулим photoId(), а потом делаем все как раньше
						self.photosUsers = result.data.photosUsers;
						self.photosComments = result.data.photosComments;
						self.photosCnt = result.data.photosCnt;

						self.photoContext(result.data.photoContext);
						self.photoContextUser(result.data.photoContextUserId ? self.photosUsers[result.data.photoContextUserId] : null);
						self.photoContextName(result.data.photoContextName);

						if (self.mode() == "album")
							self.photoId(null);

						self.photos(result.data.photos);

						self.modalWindow.headerWidget({name:"photoHeader",photoPage:self});
						self.modalWindow.width(830);
						self.modalWindow.cssPosition("absolute");
					}
					if (result.error) {
						self.core.error(result.error);
					}
					self.emit("ready");
				}
			});
		}

		this.openPhotoFromContext = function(photo_id) {
			self.mode("default");
			self.photoId(photo_id);
		}

		this.openContext = function() {
			self.mode("context");
		}

		this.photoClick = function() {
			if (self.photo() && self.photo().nextPhotoId > 0) {
				self.photoId(self.photo().nextPhotoId);
			}
			else {
				self.modalWindow.destroy();
			}
		}

		this.domInit = function(obj,element,firstDomChild) {
			self.loadPhoto();
		}
	}

	return PhotoPage;
});