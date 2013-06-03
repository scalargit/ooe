sw.gmap.Utils = {
    getColorHexValue: function(colorName) {
		switch (colorName) {
			// these return values match the marker colors of the same name
			case 'pink': return 'FF99CC';
			case 'orange': return 'FF9900';
			case 'yellow': return 'FFFF00';
			case 'green': return '00FF00';
			case 'blue': return '0000FF';
			case 'lightBlue': return '33CCCC';
			case 'purple': return 'CC99FF';
			case 'black': return '000000';
			case 'red': return 'FF0000';
			default: return colorName;
		}
	}
};