const fs = require('fs');

fs.writeFileSync('./test.sol', createIsomorphicStructure('Test', [
    {fieldType: 'uint128', fieldName: 'a'},
    {fieldType: 'uint64', fieldName: 'b'},
    {fieldType: 'uint64', fieldName: 'c'},
]));

function createIsomorphicStructure(name, fields) {
    const baseTemplate = fs.readFileSync('./templates/baseTemplate.txt').toString();
    file = baseTemplate
    .replaceAll('${NAME}', name)
    .replace('${STRUCT}', buildStructure(name, fields))
    .replace('${LIBRARY_PACKED_GETTERS}', indent(buildPackedGetters(name, fields)))
    .replace('\n${LIBRARY_PACKED_SETTERS}', '\n\n' + indent(buildPackedSetters(name, fields)))
    return file;
}

function buildStructure(name, fields) {
    let struct = `struct ${name} {\n`

    for (const field of fields) {
        struct += `  ${field.fieldType} ${field.fieldName};\n`
    }

    struct += `}`;
    return struct;
}
function buildPackedGetters(name, fields) {
    let library = '// #### GETTERS ####\n';

    let currentOffset = 0;

    const fieldGetterTemplate = fs.readFileSync('./templates/structure-packed/fieldGetter.txt').toString();
    const masks = {};
    const offsets = [];
    
    for (const field of fields) {
        let loadLogic;
        let typeSize = Number(field.fieldType.match(/\d+/)[0]);

        let maskName = field.fieldType.toUpperCase() + '_MASK';
        if (!masks[maskName]) {
            const maskValue = '0x' + (2n ** BigInt(typeSize) - 1n).toString(16).toUpperCase();
            masks[maskName] = { maskType: field.fieldType, maskValue };
        }

        if (currentOffset == 0) {
            loadLogic = `_${field.fieldName} := and(${maskName}, _packed)`;
        } else {
            const offsetName = `${field.fieldName.toUpperCase()}_OFFSET`;
            offsets.push({ offsetName, offsetValue: currentOffset })
            loadLogic = `_${field.fieldName} := and(${maskName}, shr(${offsetName}, _packed))`;
        }

        const fieldGetter = fieldGetterTemplate
        .replaceAll('${FIELD_NAME}', field.fieldName)
        .replaceAll('${FIELD_TYPE}', field.fieldType)
        .replaceAll('${NAME}', name)
        .replaceAll('${LOAD_LOGIC}', loadLogic)

        library += (currentOffset != 0 ? '\n\n' : '') + fieldGetter;

        currentOffset += typeSize;

        if (currentOffset > 256) throw new Error('Invalid size of structure');
    }

    if (offsets.length > 0) {
        let offsetsConstants = '';
        for (const offset of offsets) {
            offsetsConstants += `uint256 private constant ${offset.offsetName} = ${offset.offsetValue};\n`;
        }
        offsetsConstants += '\n';
        library = offsetsConstants + library;
    }

    if (Object.keys(masks).length > 0) {
        let masksConstants = '';
        for (const maskName of Object.keys(masks)) {
            const mask = masks[maskName];
            masksConstants += `uint256 private constant ${maskName} = ${mask.maskValue};\n`;
        }
        masksConstants += '\n';
        library = masksConstants + library;
    }

    return library;
}

function buildPackedSetters(name, fields) {
    let library =  '// #### SETTERS ####\n';

    let currentOffset = 0;

    const fieldSetterTemplate = fs.readFileSync('./templates/structure-packed/fieldSetter.txt').toString();
    const masks = {};
    
    for (const field of fields) {
        let setLogic;
        let typeSize = Number(field.fieldType.match(/\d+/)[0]);

        let maskName = field.fieldType.toUpperCase() + '_MASK';
        if (!masks[maskName]) {
            const maskValue = '0x' + (2n ** BigInt(typeSize) - 1n).toString(16).toUpperCase();
            masks[maskName] = { maskType: field.fieldType, maskValue };
        }

        if (currentOffset == 0) {
            setLogic = `_result := or(and(not(${maskName}), _packed), _${field.fieldName})`;
        } else {
            const offsetName = `${field.fieldName.toUpperCase()}_OFFSET`;
            setLogic = `_result := or(and(not(shl(${offsetName}, ${maskName})), _packed), shl(${offsetName}, _${field.fieldName}))`;
        }

        const fieldSetter= fieldSetterTemplate
        .replaceAll('${FIELD_NAME_CAMEL_CASE}', field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1))
        .replaceAll('${FIELD_NAME}', field.fieldName)
        .replaceAll('${FIELD_TYPE}', field.fieldType)
        .replaceAll('${NAME}', name)
        .replaceAll('${LOAD_LOGIC}', setLogic)

        library += (currentOffset != 0 ? '\n\n' : '') + fieldSetter;

        currentOffset += typeSize;

        if (currentOffset > 256) throw new Error('Invalid size of structure');
    }
    return library;
}

function indent(code, indentation = '  ') {
    return code.split('\n').map(x => {
        if (x == '') return '';
        return indentation + x;
    }).join('\n');
}