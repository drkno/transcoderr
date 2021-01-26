class CodecBucket {
    constructor(prefix) {
        this._prefix = prefix;
    }

    filterPatterns() {
        return [`-${this._prefix}f`, `-filter:${this._prefix}`];
    }

    encoderPatterns() {
        return [`-c:${this._prefix}`, `-${this._prefix}codec`, `-codec:${this._prefix}`];
    }

    patterns() {
        return this.filterPatterns().concat(this.encoderPatterns());
    }

    merge(options) {
        const encoderPatterns = this.encoderPatterns();
        const filterPatterns = this.filterPatterns();

        const filter = options.filter(option => filterPatterns.includes(option[0]))
                                .map(option => option.slice(1))
                                .flatMap(a => a)
                                .join(',');

        let encode = options.filter(option => encoderPatterns.includes(option[0]))
                            .map(option => option[1])
                            .reduce((acc, curr) => {
                                if (acc !== '' && acc !== curr) {
                                    throw new Error(`Attempting to merge incompatible encoder options, '${encoderPatterns[0]} ${acc}' and '${encoderPatterns[0]} ${curr}'.`)
                                }
                                return curr;
                            }, '');

        if (filter !== '' && encode === 'copy') {
            LOG.warn('Filtering and streamcopy cannot be used together, demoting copy to encode');
            encode = '';
        }
        else if (filter === '' && encode === '') {
            encode = 'copy';
        }

        let results = [];
        if (encode !== '') {
            results = results.concat([encoderPatterns[0], encode]);
        }
        if (filter !== '') {
            results = results.concat([filterPatterns[0], filter]);
        }
        return results;
    }
}

class VideoCodecBucket extends CodecBucket {
    constructor() {
        super('v');
    }
}

class AudioCodecBucket extends CodecBucket {
    constructor() {
        super('a');
    }
}

class SubtitleCodecBucket extends CodecBucket {
    constructor() {
        super('s');
    }
}

class MapBucket {
    patterns() {
        return ['-map'];
    }

    merge(options) {
        if (options.length > 0) {
            return options.flatMap(a => a);
        }
        return ['-map', '0'];
    }
}

class CatchAllBucket {
    patterns() {
        return ['*'];
    }

    merge(options) {
        return options.flatMap(a => a);
    }
}

class MergeFilterPlugin {
    constructor() {
        this._buckets = [
            new VideoCodecBucket(),
            new AudioCodecBucket(),
            new SubtitleCodecBucket(),
            new CatchAllBucket(),
            new MapBucket()
        ];
    }

    describe() {
        return {
            name: 'merge',
            description: 'merges ffmpeg options',
            version: '1.0.0',
            types: ['filter']
        };
    }

    _generateBuckets(buckets) {
        const bucketMap = {};
        for (let bucket of buckets) {
            const bucketItem = {
                collector: bucket,
                list: []
            };
            for (let bucketReference of bucket.patterns()) {
                bucketMap[bucketReference] = bucketItem;
            }
        }
        return bucketMap;
    }

    async filtermain(collector) {
        try {
            const buckets = this._generateBuckets(this._buckets);
            const options = collector.getFfmpegOptions();
            if (options.length === 0) {
                collector.vetoExec();
                return;
            }

            for (let option of options) {
                const firstOption = option[0];
                const bucket = buckets[firstOption] || buckets['*'];
                bucket.list.push(option);
            }

            collector.replaceAllFfmpegOptions([...new Set(Object.values(buckets))]
                .map(bucket => bucket.collector.merge(bucket.list))
                .flatMap(a => a));
        }
        catch(e) {
            LOG.error(e);
            throw e;
        }
    }
}

module.exports = MergeFilterPlugin;
