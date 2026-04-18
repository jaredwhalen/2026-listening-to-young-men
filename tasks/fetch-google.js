import fs from "fs";
import archieml from "archieml";
import docs from "../google.config.js";
import { camelCase } from 'change-case';
const CWD = process.cwd();

/**
 * Camel case all object keys. Modified from https://stackoverflow.com/a/41072596
 * @param {Object} input Object you want to mute
 * @returns Mutated object
 */
let objectKeysToLowerCase = function (input) {
	if (typeof input !== 'object') return input;
	if (Array.isArray(input)) return input.map(objectKeysToLowerCase);
	return Object.keys(input).reduce(function (newObj, key) {
		let val = input[key];
		let newVal =
			typeof val === 'object' && val !== null
				? objectKeysToLowerCase(val)
				: val;
		newObj[camelCase(key)] = newVal;
		return newObj;
	}, {});
};

const fetchGoogle = async ({ id, gid }) => {
	console.log(`fetching...${id}`);

	const base = "https://docs.google.com";
	const post = gid
		? `spreadsheets/u/1/d/${id}/export?format=csv&id=${id}&gid=${gid}`
		: `document/d/${id}/export?format=txt`;
	const url = `${base}/${post}`;

	try {
		const response = await fetch(url);
		
		// Ensure proper UTF-8 decoding
		// Get the response as an ArrayBuffer first, then decode as UTF-8
		const arrayBuffer = await response.arrayBuffer();
		const text = new TextDecoder('utf-8').decode(arrayBuffer);

		if (gid) return text;

		const parsed = archieml.load(text);
		const str = JSON.stringify(objectKeysToLowerCase(parsed));
		return str;
	} catch (err) {
		throw new Error(err);
	}
};

(async () => {
	for (let d of docs) {
		try {
			const str = await fetchGoogle(d);
			const file = `${CWD}/${d.filepath}`;
			// Explicitly write with UTF-8 encoding
			fs.writeFileSync(file, str, 'utf8');
		} catch (err) {
			console.log(err);
		}
	}
})();
