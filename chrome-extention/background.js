chrome.browserAction.onClicked.addListener(function(activeTab){
	var newURL = "https://asamaru7.github.io/SpriteImageGenerator/";
	chrome.tabs.create({ url: newURL });
});