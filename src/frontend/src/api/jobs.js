class JobsApi {
    async getAllJobs() {
        const res = await fetch('/api/v1/job/all');
        return await res.json();
    }

    async abortJob(id) {
        const res = await fetch(`/api/v1/job/${id}`, {
            method: 'delete'
        });
        return await res.json();
    }

    async rerunJob(id) {
        const res = await fetch(`/api/v1/job/${id}`, {
            method: 'post'
        });
        return await res.json();
    }
}


export default new JobsApi();
