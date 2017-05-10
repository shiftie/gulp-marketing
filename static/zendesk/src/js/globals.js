import $ from 'jquery';
import universeSearch from 'search';
import NewsletterSignup from 'newsletter';
import CrossStorageClient from 'cross-storage';
import picoModal from 'picomodal';

window.$ = window.jQuery = $;
window.universeSearch = universeSearch;
window.NewsletterSignup = NewsletterSignup;
window.CrossStorageClient = CrossStorageClient;
window.picoModal = picoModal;

jQuery.migrateMute = true;