github:
	rm -rf docs
	cp -r dist docs
	touch docs/.nojekyll
	git add -A
	git commit -m "update github pages"
	git push
	

publish:
	npm run publish