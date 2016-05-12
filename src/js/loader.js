/**
 * Fake AMD-style modules for Phoenix
 *
 * Works when compiling TypeScript with a single outfile and AMD modules.
 */
(function (global, require) {
	var defines = {},
		defQueue = [];

	global.require = function (mod) {
		require(mod + '.js');
	}

	global.define = function (name, deps, callback) {
		defQueue.push({ name: name, deps: deps, callback: callback });
		processQueue();
	}

	function findDeps(depNames, num) {
		var deps = [];

		for (var i = 0; i < depNames.length; i++) {
			if (num === deps.length) {
				return deps;
			}

			if (!defines[depNames[i]]) {
				return false;
			}

			deps.push(defines[depNames[i]]);
		}

		return deps;
	}

	function processQueue() {
		var processed = 0;
		for (var i = 0; i < defQueue.length; i++) {
			var item = defQueue[i];

			// Ignore first two parameters (require and exports)
			var resolvedDeps = findDeps(item.deps.slice(2), item.callback.length - 2);
			if (!resolvedDeps) {
				continue;
			}

			var exports = {};
			var deps = [require, exports].concat(resolvedDeps);
			item.callback.apply(item.callback, deps);

			defines[item.name] = exports;
			defQueue.splice(i, 1);
			processed++;
		}

		// Repeat until nothing new is processed
		if (processed > 0) {
			processQueue();
		}
	}
})(this, require);
