const LABEL = {
	Democratic: 'Dem.',
	Republican: 'Rep.',
	Independent: 'Ind.',
	Other: 'other',
	Moderate: 'Moderate',
	Conservative: 'Conservative',
	Liberal: 'Liberal',
	'No opinion': 'No opinion',
	White: 'White',
	Black: 'Black',
	Latino: 'Latino',
	Asian: 'Asian',
	'No degree': 'No degree',
	Degree: 'Degree',
	'18-24': '18–24',
	'25-34': '25–34'
};

export function shortCategory(category) {
	return LABEL[category] ?? category;
}

export function formatAttributeItems(items) {
	return items.map((i) => `${i.value}% ${shortCategory(i.category)}`).join(', ');
}
