export const getDeepChildNum = (data) => {
    let len = 0;
    if (data.children) {
        len += data.children.length;

        //  add children into the calculation
        data.children.forEach((d) => {
            len += getDeepChildNum(d);
        });
    }

    return len;
};

export const getDeepChildSize = (data) => {
    let size = (data.size) ? data.size : 0;
    if (data.children) {
        //  add children into the calculation
        data.children.forEach((d) => {
            size += getDeepChildSize(d);
        });
    }

    return size;
};

export const collisionSizeStrategy = (a, b) => {
    return b[1] - a[1];
};

export const childrenNumStrategy = (a, b) => {
    const aLen = getDeepChildNum(a[0].data);
    const bLen = getDeepChildNum(b[0].data);
    return aLen - bLen;
};

export const childrenSizeStrategy = (a, b) => {
    const aSize = getDeepChildSize(a[0].data);
    const bSize = getDeepChildSize(b[0].data);
    return aSize - bSize;
};

const labelRemovalStrategies = {
    collisionSizeStrategy,
    childrenNumStrategy,
    childrenSizeStrategy
};

export default labelRemovalStrategies;