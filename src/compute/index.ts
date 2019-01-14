
import { Computed, directionString,Vector } from '../interface';
import { getDirection,getRadian } from '../vector';
import computeLast from './computeLast';
import computeDistance from './computeDistance';
import computeDeltaXY from './computeDeltaXY';
import computeVector from './computeVector';
import computeScale from './computeScale';
import computeAngle from './computeAngle';
import computeMaxLength from './computeMaxLength';

// 最大触点数
export default function ({
    startInput,
    prevInput,
    startMutliInput,
    input
}: any): Computed {
    // 如果输入为空, 那么就计算了, 鼠标模式下, 点击了非元素部分, mouseup阶段会初选input为undefined
    if (undefined === input) return;

    const { abs, max } = Math;

    let computed = <Computed>{
        // pointers: [],
        // changedPointers: [],
        pointerLength: input.pointerLength,
        changedPointerLength: input.changedPointerLength,
        // 起始到结束的偏移
        displacementX: 0,
        displacementY: 0,
        distanceX: 0,
        distanceY: 0,
        distance: 0,

        // 方向
        direction: 'none',
        lastDirection: 'none',

        // 位移变化量
        deltaX: undefined,
        deltaY: undefined,

        //  速率
        velocityX: 0,
        velocityY: 0,
        maxVelocity: 0,
        // 时间
        duration: 0,
        timestamp: Date.now(),
        // 旋转和缩放
        angle: 0,
        deltaAngle: 0,
        scale: undefined,
        deltaScale: 1,
        lastVelocity: undefined,
        lastVelocityY: undefined,
        lastVelocityX: undefined,
        getRadian
    };

    // 滑动距离
    const { displacementX, displacementY, distanceX, distanceY, distance } = computeDistance({
        startInput,
        input
    });
    computed = { ...computed, displacementX, displacementY, distanceX, distanceY, distance };

    // 计算方向
    computed.direction = <directionString>getDirection(displacementX, displacementY);

    // 已消耗时间
    computed.duration = input.timestamp - startInput.timestamp;
    // 最近25ms内计算数据
    const lastComputed = computeLast(input);
    computed.lastVelocityX = lastComputed.velocityX;
    computed.lastVelocityY = lastComputed.velocityY;
    computed.lastVelocity = lastComputed.velocity;
    computed.lastDirection = <directionString>lastComputed.direction;

    // 中心点位移增量
    let { deltaX, deltaY } = computeDeltaXY({ input, prevInput });
    computed.deltaX = deltaX;
    computed.deltaY = deltaY;

    // 时间增量
    if (undefined !== prevInput) {
        computed.deltaTime = input.timestamp - prevInput.timestamp;
    } else {
        computed.deltaTime = 0;
    }

    // 速率
    computed.velocityX = abs(computed.distanceX / computed.duration) || 0;
    computed.velocityY = abs(computed.distanceY / computed.duration) || 0;
    computed.maxVelocity = max(computed.velocityX, computed.velocityY);

    // 多点计算
    // 上一触点数大于1, 当前触点大于1
    if (undefined !== prevInput && 1 < prevInput.pointers.length && 1 < input.pointers.length) {
        // 2指形成的向量
        const startV = computeVector(startMutliInput);
        const prevV = computeVector(prevInput);
        const activeV = computeVector(input);
        // 计算缩放
        const { deltaScale, scale } = computeScale({
            startV, activeV, prevV
        });
        computed.scale = scale;
        computed.deltaScale = deltaScale;
        // console.log({scale, deltaScale});

        // 计算旋转角度
        const { angle, deltaAngle } = computeAngle({ startV, prevV, activeV });
        computed.angle = angle;
        computed.deltaAngle = deltaAngle;
    }

    // 最大触点数
    const maxPointerLength = computeMaxLength(input);

    return {
        ...input,
        maxPointerLength,
        ...computed
    };
};