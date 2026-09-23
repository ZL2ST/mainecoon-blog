import PhotoSwipeLightbox from "/vendor/photoswipe-lightbox.esm.min.js";

const lightbox = new PhotoSwipeLightbox({
  gallery: ".gallery",
  children: "a",
  bgOpacity: 1,
  showHideAnimationType: "fade",
  pswpModule: () => import("/vendor/photoswipe.esm.min.js"),
});
lightbox.init();
