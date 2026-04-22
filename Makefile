.PHONY: github github-embed publish sync-docs

sync-docs:
	rm -rf docs
	cp -r dist docs
	touch docs/.nojekyll

github: sync-docs
	git add -A
	git commit -m "update github pages"
	git push

github-embed:
	npm run build
	npm run embed:all
	$(MAKE) sync-docs
	git add -A
	git commit -m "update github pages"
	git push

publish:
	npm run publish
