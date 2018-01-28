import { getRandomInt, withChance } from '../utils';
import { onShipCrash, onFieldChange } from '../App';

export enum FieldType {
    Space,
    Block,
    Ship,
    Wall
}

export enum ShipMovement {
    Left,
    Right,
    Straight
}

export interface ShipInfo {
    firstBlockOffset: number;
    firstBlockWidth: number;
    longestSpaceOffset: number;
}

export type Field = Array<Array<FieldType>>;

export class Game {
    private field: Field;
    private onChange: onFieldChange;
    private onCrash: onShipCrash;
    private width: number;
    private height: number;
    private tick: number;
    private startDelay: number;
    private unsubscribers: Array<() => void> = [];
    private score = 0;
    private movements = 0;

    constructor(
        width: number, 
        height: number, 
        tick: number,
        startDelay: number,
        onChange: onFieldChange,
        onCrash: onShipCrash
    ) {
        this.width = width;
        this.height = height;
        this.onChange = onChange;
        this.onCrash = onCrash;
        this.tick = tick;
        this.startDelay = startDelay;
        this.field = this.generateField();

        this.onChange(this.field);
    }

    moveShip(movement: ShipMovement) {
        if (movement === ShipMovement.Straight) {
            return;
        }

        const movementStatus = movement === ShipMovement.Left ? this.updateShipIndex(-1) : this.updateShipIndex(1);
        if (movementStatus) {
            this.onChange(this.field);
        }
    }

    start() {
        let intervalId: number; 
        let timeoutId: number;
        let tickNumber = 0;

        timeoutId = window.setTimeout(
            () => {
                intervalId = window.setInterval(
                    () => {
                        const moveResult = this.moveField();
                        if (!moveResult) {
                            return;
                        }

                        if (tickNumber % 2 === 0 && withChance(90)) {
                            this.generateRandomBlock();
                        }
                        
                        this.onChange(this.field); 
                        this.score++;
                        tickNumber++;
                    }, 
                    this.tick
                );
            }, 
            this.startDelay
        );

        this.unsubscribers.push(
            () => window.clearInterval(intervalId),
            () => window.clearTimeout(timeoutId)
        );
    }

    dispose() {
        this.unsubscribers.forEach((disposer) => disposer && disposer());
    }

    // Calculates current ship location info offest to the first block, the nearest block width etc.
    getShipInfo(): ShipInfo {
        const fieldHeight = this.height - 1;
        const shipIndex = this.getShipIndex();

        let firstBlockOffset;
        let firstBlockWidth = 1;
        let longestSpaceOffset;

        for (let i = fieldHeight; i > -1; i--) {
            const blockIndex = this.field[i].indexOf(FieldType.Block);

            if (blockIndex === -1) {
                continue;
            } 

            if (this.field[i][blockIndex + 1] === FieldType.Block) {
                firstBlockWidth++;
            }

            if (this.field[i][blockIndex + 2] === FieldType.Block) {
                firstBlockWidth++;
            }
            const blockCenterOffset = (firstBlockWidth - 1) / 2;

            const firstBlockCenter = blockIndex + blockCenterOffset;

            firstBlockOffset = shipIndex - firstBlockCenter;

            // Finding offset between shup and the center of the widest empty space on the block row
            // w__a_____w -> w__a__I__w
            // 2_____a__w -> w__I__a__w
            if (firstBlockCenter >= this.width / 2) {
                longestSpaceOffset = shipIndex - (Math.floor((firstBlockCenter - 1) / 2) + 1 - blockCenterOffset);
            } else {
                longestSpaceOffset = shipIndex 
                    - (Math.round((this.width - 2 - firstBlockCenter) / 2) + firstBlockCenter + blockCenterOffset);
            }

            break;
        }

        return {
            firstBlockOffset: firstBlockOffset !== undefined ? firstBlockOffset : 1,
            longestSpaceOffset: longestSpaceOffset !== undefined ? longestSpaceOffset : 0,
            firstBlockWidth: firstBlockWidth !== undefined ? firstBlockWidth : 0
        };
    }

    private crash() {
        this.dispose();
        this.onCrash(this.score, this.movements);
    }

    private updateShipIndex(shipPositionDelta: number): boolean {
        const shipRow = this.field[this.field.length - 1];
        const shipIndex = this.getShipIndex();

        this.movements++;

        shipRow[shipIndex] = FieldType.Space;
        if (shipRow[shipIndex + shipPositionDelta] !== FieldType.Space) {
            this.crash();
            return false;
        }
        shipRow[shipIndex + shipPositionDelta] = FieldType.Ship;

        return true;
    }

    private moveField(): boolean {
        this.field.unshift(this.generateEmptyRow());
        const lastRow = this.field.pop();
        const shipIndex = lastRow!.indexOf(FieldType.Ship);

        if (this.field[this.field.length - 1][shipIndex] !== FieldType.Space) {
            this.crash();
            return false;
        }

        this.field[this.field.length - 1][shipIndex] = FieldType.Ship; 

        return true;
    }

    private generateRandomBlock() {
        const fillIndexes = [];
        let blockPosition;

        if (withChance(15)) {
            blockPosition = getRandomInt(1, this.width - 3);
            fillIndexes.push(blockPosition, blockPosition + 1, blockPosition + 2);
        } else if (withChance(35)) {
            blockPosition = getRandomInt(1, this.width - 2);
            fillIndexes.push(blockPosition, blockPosition + 1);
        } else {
            // Generates at least one block under the ship not to give a possibility for the ship
            // stay too long
            blockPosition = !this.movements ? this.getShipIndex() : getRandomInt(1, this.width - 1);
            fillIndexes.push(blockPosition);
        }

        fillIndexes.forEach((index) => this.field[0][index] = FieldType.Block);
    }

    private getShipIndex() {
        return this.field[this.field.length - 1].indexOf(FieldType.Ship);
    }

    private generateField(): Field {
        const field = [];

        for (let i = 0; i < this.height; i++) {
            field.push(this.generateEmptyRow());
        }

        field[field.length - 1][Math.floor(this.width / 2)] = FieldType.Ship;

        return field;
    }

    private generateEmptyRow(): Array<FieldType> {
        const row = [FieldType.Wall];

        for (let j = 1; j < this.width - 1; j++) {
            row.push(FieldType.Space);
        }

        row.push(FieldType.Wall);

        return row;
    }
}
