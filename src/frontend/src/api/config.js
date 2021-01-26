class ConfigApi {
    async getAllConfigItems() {
        const res = await fetch('/api/v1/config');
        return await res.json();
    }

    async setKey(id, value) {
        const res = await fetch(`/api/v1/config/${id}`, {
            method: 'post',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                value
            })
        });
        return await res.json();
    }

    async deleteKey(id) {
        const res = await fetch(`/api/v1/config/${id}`, {
            method: 'delete'
        });
        return await res.json();
    }
}


export default new ConfigApi();
