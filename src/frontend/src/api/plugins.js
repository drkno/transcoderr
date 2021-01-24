class PluginsApi {
    async getAllPlugins() {
        const res = await fetch('/api/v1/plugin');
        return await res.json();
    }

    async enablePlugin(id) {
        const res = await fetch(`/api/v1/plugin/enable/${id}`, {
            method: 'post'
        });
        return await res.json();
    }

    async disablePlugin(id) {
        const res = await fetch(`/api/v1/plugin/disable/${id}`, {
            method: 'post'
        });
        return await res.json();
    }

    async removePlugin(id) {
        const res = await fetch(`/api/v1/plugin/remove/${id}`, {
            method: 'delete'
        });
        return await res.json();
    }
}


export default new PluginsApi();
