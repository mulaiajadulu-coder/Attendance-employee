const calculateTenure = (joinDate) => {
    const start = new Date(joinDate);
    const now = new Date();

    // Calculate Tenure
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        months--;
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const tenureDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const tenureString = years > 0
        ? `${years} Tahun ${months} Bulan`
        : months > 0
            ? `${months} Bulan ${days} Hari`
            : `${days} Hari`;

    return {
        years,
        months,
        days,
        total_days: tenureDays,
        string: tenureString
    };
};

const updateUserLeave = async (user) => {
    const joinDate = new Date(user.tanggal_bergabung);
    const now = new Date();
    const years = now.getFullYear() - joinDate.getFullYear();

    // Anniversary logic: if tenure >= 1 year
    if (years >= 1) {
        const currentUpdateYear = now.getFullYear();
        const lastUpdateDate = user.last_leave_update ? new Date(user.last_leave_update) : null;
        const lastUpdateYear = lastUpdateDate ? lastUpdateDate.getFullYear() : 0;

        if (lastUpdateYear < currentUpdateYear) {
            user.jatah_cuti = 12;
            user.sisa_cuti = 12;
            user.last_leave_update = now;
            await user.save();
        }
    }
};

module.exports = { calculateTenure, updateUserLeave };
